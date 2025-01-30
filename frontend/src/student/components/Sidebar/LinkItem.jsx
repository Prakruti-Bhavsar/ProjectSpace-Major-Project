import { Link } from "react-router-dom";

const LinkItem = ({ href, icon: Icon, text, badge }) => {
  return (
    <li>
      <Link
        to={href} // Use 'to' instead of 'href'
        className="flex items-center p-2 text-gray-900 
        rounded-lg dark:text-white 
        hover:bg-[#4B49AC]
        dark:hover:bg-gray-700 hover:text-[#ffffff] transition duration-300"
      >
        <Icon className="mr-3 text-white" />
        <span className="flex-1 me-3 text-white">{text}</span>
        {badge && (
          <span
            className={`inline-flex
                          item-center justify-center px-2 ms-3 text-sm
                          font-medium rounded-full ${badge.color} ${badge.darkColor}`}
          >
            {badge.text}
          </span>
        )}
      </Link>
    </li>
  );
};

export default LinkItem;
