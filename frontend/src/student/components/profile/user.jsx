import userLogo from "../../assets/user02.png"
const User = () => {
  return (
    <div className="flex gap-3 items-center bg-[#10acd0] p-2 rounded-full 
    dark:bg-gray-600 dark:text-gray-300">
        <img src={userLogo} alt="user image" className="w-12 h-12 rounded-full"/>
        <div >
            <h3 className="font-semibold text-xl text-white">John Doe</h3>
            <p className="font-bold font-sm text-white">21104057</p>
        </div>
    </div>

  )
}

export default User