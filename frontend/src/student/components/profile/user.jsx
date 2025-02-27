import userLogo from "../../assets/user01.png"
const User = () => {
  return (
    <div className="flex gap-3 items-center bg-[#62d0f3] p-2 rounded-full 
    dark:bg-gray-600 dark:text-gray-300 shadow-md ">
        <img src={userLogo} alt="user image" className="w-12 h-12 rounded-full"/>
        <div >
            <h3 className="font-semibold text-xl text-white">Payal Gupta</h3>
            <p className="font-bold font-sm text-white">21104057</p>
        </div>
    </div>

  )
}

export default User