import Link from "next/link";
import DarkModeSwitcher from "./DarkModeSwitcher";
import DropdownMessage from "./DropdownMessage";
import DropdownNotification from "./DropdownNotification";
import DropdownUser from "./DropdownUser";
import Image from "next/image";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import Select from "react-select";

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const response = await axios.get("http://localhost:5000/projects", {
          headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
        });
        const fetchedProjects = response.data.projects.filter((project: any) =>
          project.membres.some((member: any) => member.utilisateur === session?.user?._id)
        );
        setProjects(fetchedProjects);
      } catch (err) {
        console.error("Failed to fetch projects.");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.accessToken) {
      fetchProjects();
    }
  }, [session?.user?.accessToken]);

  const projectOptions = projects.map((project) => ({
    value: project._id,
    label: project.nom,
  }));

  const handleProjectChange = (selectedOption: { value: string; label: string }) => {
    if (selectedOption) {
      window.location.href = `/projects/${selectedOption.value}/tasks`;
    }
  };

  return (
    <header className="sticky top-0 z-999 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          {/* <!-- Hamburger Toggle BTN --> */}
          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
          >
            <span className="relative block h-5.5 w-5.5 cursor-pointer">
              <span className="du-block absolute right-0 h-full w-full">
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-[0] duration-200 ease-in-out dark:bg-white ${
                    !props.sidebarOpen && "!w-full delay-300"
                  }`}
                ></span>
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-150 duration-200 ease-in-out dark:bg-white ${
                    !props.sidebarOpen && "delay-400 !w-full"
                  }`}
                ></span>
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-200 duration-200 ease-in-out dark:bg-white ${
                    !props.sidebarOpen && "!w-full delay-500"
                  }`}
                ></span>
              </span>
              <span className="absolute right-0 h-full w-full rotate-45">
                <span
                  className={`absolute left-2.5 top-0 block h-full w-0.5 rounded-sm bg-black delay-300 duration-200 ease-in-out dark:bg-white ${
                    !props.sidebarOpen && "!h-0 !delay-[0]"
                  }`}
                ></span>
                <span
                  className={`delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-sm bg-black duration-200 ease-in-out dark:bg-white ${
                    !props.sidebarOpen && "!h-0 !delay-200"
                  }`}
                ></span>
              </span>
            </span>
          </button>
          {/* <!-- Hamburger Toggle BTN --> */}

          <Link className="block flex-shrink-0 lg:hidden" href="/">
            <Image
              width={32}
              height={32}
              src={"/images/logo/logo-icon.svg"}
              alt="Logo"
            />
          </Link>
        </div>

        <div className="hidden sm:block">
          <Select
            options={projectOptions}
            onChange={handleProjectChange}
            placeholder="Search for projects..."
            isLoading={loading}
            styles={{
              control: (provided) => ({
                ...provided,
                width: "500px", // Adjust the width as needed
                backgroundColor: "transparent",
                borderColor: "transparent", // Remove the border
                boxShadow: "none", // Remove the shadow
                '&:hover': {
                  borderColor: 'transparent', // Remove the border on hover
                },
              }),
              menu: (provided) => ({
                ...provided,
                zIndex: 9999,
                maxHeight: "300px", // Adjust the max height as needed
              }),
              menuList: (provided) => ({
                ...provided,
                scrollbarWidth: "none", // Hide the scrollbar
                msOverflowStyle: "none", // Hide the scrollbar for Internet Explorer
                '&::-webkit-scrollbar': {
                  display: "none", // Hide the scrollbar for WebKit browsers
                },
              }),
              indicatorSeparator: () => ({ display: 'none' }), // Remove the separator
              dropdownIndicator: () => ({ display: 'none' }), // Remove the dropdown indicator
            }}
          />
        </div>

        <div className="flex items-center gap-3 2xsm:gap-7">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            {/* <!-- Dark Mode Toggler --> */}
            <DarkModeSwitcher />
            {/* <!-- Dark Mode Toggler --> */}

            {/* <!-- Notification Menu Area --> */}
            <DropdownNotification />
            {/* <!-- Notification Menu Area --> */}

            {/* <!-- Chat Notification Area --> */}
            <DropdownMessage />
            {/* <!-- Chat Notification Area --> */}
          </ul>

          {/* <!-- User Area --> */}
          <DropdownUser />
          {/* <!-- User Area --> */}
        </div>
      </div>
    </header>
  );
};

export default Header;
