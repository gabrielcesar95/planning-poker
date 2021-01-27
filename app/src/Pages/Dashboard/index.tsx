import './index.css'
import { Button, Container} from '@material-ui/core'
import React, { useCallback, useEffect, useState }  from 'react'
import MainToolbar from '../../Components/Shared/MainToolbar'
import ShellCard from '../../Components/ShellCard'
import UserItem from '../../Components/UserItem'
import SocketService from '../../Services/SocketService/socket.service'
import { getUserFromStorage, getUserRoomFromStorage } from '../../Helpers'
import User from '../../Domain/user'
import LocalStorageKeys from '../../Consts/localStorageKeys'

const DashboardPage = () => {

    const options = ['0', '1/2', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?']
    
    const [currentHistory, setCurrentStory] = useState<string>('VPOWER-4242')
    const [users, setUsers] = useState<User[]>([])
    const currentUser = getUserFromStorage()
    const currentRoom = getUserRoomFromStorage()
    const [socketService, setSocketService] = useState<SocketService | null>(null)
    const [tempLastVote, setTempLastVote] = useState<string | null>(null)
    const [showVotes, setShowVotes] = useState<boolean>(false)

    const refreshCurrentRoom = (data: any) => {
        const mappedUsers: User[] = data.users.map((user: any) => new User({ userId: user.id, userName: user.name, vote: user.vote }))
        const showRoomVotes = Boolean(data.showVotes)
        const currentStory = (data.story)
        setUsers(mappedUsers)
        setShowVotes(showRoomVotes)
        setCurrentStory(currentStory)
    }

    const cleanUserVotes = () => {
        setTempLastVote(null)
        localStorage.removeItem(LocalStorageKeys.UserLastVote)
    }

    const initializeSocket = (action = true): void => {
        const ss = new SocketService(currentRoom, currentUser.userId, currentUser.userName)

        if(!action){
            ss.disconnect()
            setSocketService(null)    
            return
        }

        ss.on('refreshRoom', refreshCurrentRoom)
        ss.on('cleanVotes', cleanUserVotes)
        setSocketService(ss)
    }

    const vote = useCallback(
        (vote: string) =>{
            localStorage.setItem(LocalStorageKeys.UserLastVote, vote)
            setTempLastVote(vote)
            socketService!.emit('newVote', {
                vote,
                currentUser
            })
        }, [socketService, currentUser]
    )

    const changeVoteVisibility = () => {
        socketService!.emit('changeVoteVisibility', (!showVotes))
    }

    const cleanRoomVotes = () => {
        socketService!.emit('cleanVotes', null)
    }

    useEffect(() => {
        const lastVote = localStorage.getItem(LocalStorageKeys.UserLastVote)
        if(socketService && lastVote && !tempLastVote) { vote(lastVote) }
    }, [socketService, vote, tempLastVote])

    useEffect(() => {
        if(!socketService || !socketService.isConnected()){
            initializeSocket()
        }
    //eslint-disable-next-line
    },[])

    useEffect(() => {
        return () => {
            initializeSocket(false)
        }
     //eslint-disable-next-line
    },[])

    return(
        <>
           <MainToolbar 
            changeVoteVisibility={changeVoteVisibility}
            cleanRoomVotes={cleanRoomVotes}
            voteVisibility={showVotes}
            />

            <Container id='shell-main-container-with-toolbar' maxWidth="lg">
                <div id="shell-story-label">
                    <Button color="secondary">
                        <b>Story</b>
                    </Button>
                </div>
                <div id="shell-story-name">{currentHistory}</div>

               <div id="shell-card-table">
                {options.map(option => <ShellCard key={option} voteFunction={vote} value={option} currentVote={tempLastVote}/>)}
               </div>

               <div id="shell-users-table">
                   {(users) && users.map(user => <UserItem key={user.userId} name={user.userName} vote={user.vote} showVotes={showVotes} />)}
               </div>

            </Container>
        </>
    )
}

export default DashboardPage