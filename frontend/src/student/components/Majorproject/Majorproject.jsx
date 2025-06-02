import MajorContent from "./MajorContent";
const Majorproject = ({ isSidebarOpen, isMobile }) => {
  return (
    <div className={`w-full bg-white border border-gray-200 mt-2 rounded-lg mr-2 shadow-md 
      transition-all duration-300
      ${!isMobile ? 'md:ml-64' : isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <MajorContent/>
    </div>
  )
}

export default Majorproject 