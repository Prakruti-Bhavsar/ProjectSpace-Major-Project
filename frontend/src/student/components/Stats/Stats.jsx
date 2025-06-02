import MiniProject from './Miniproject';

const Stats = ({ isSidebarOpen, isMobile }) => {
  return (
    <div className={`w-full bg-white border border-gray-200 mt-2 rounded-lg mr-2 shadow-md 
      transition-all duration-300
      ${!isMobile ? 'ml-64 w-auto' : isSidebarOpen ? 'ml-64 w-auto' : 'w-full'}`}>
      <MiniProject />
    </div>
  );
};

export default Stats;
