import React, { useState, useContext } from "react";
import { useNavigate} from "react-router-dom";
// import Cookies from "universal-cookie";
// import Button from "../utility/button";
import {navLinks} from "../data/contact";
import {close, menu, TechNoobLogo} from "../data/assets";
// import { useNavigate } from "react-router-dom";
import { AppContext } from "../AppContext/AppContext";
import {Link} from "react-router-dom";
// const cookies = new Cookies();

const NavBar = () => {
  // const { setIsLoggedIn, setUserProfile } = useContext(AppContext);

  // const navigate = useNavigate();

  const [toggle, setToggle] = useState(false);
  const [active, setActive] = useState("");
  const { UserProfile, setDashboardToggle } = useContext(AppContext);
  const navigate = useNavigate();

  const handleActive = (e) => {
    setActive(e.target.innerText);
  };

  // const logOut = async () => {
  //   let myHeaders = new Headers();
  //   myHeaders.append("Content-Type", "application/json");

  //   let requestOptions = {
  //     method: "POST",
  //     headers: myHeaders,
  //     redirect: "follow",
  //     credentials: "include",
  //   };

  //   let user = cookies.get("user");

  //   if (user) {
  //     fetch(
  //       "https://technoob-staging.azurewebsites.net/api/v1/authenticate/logout",
  //       requestOptions
  //     )
  //       .then((response) => {
  //         if (response.status === 200) {
  //           setIsLoggedIn(false);
  //           setUserProfile(null);
  //           cookies.remove("user");
  //         }
  //         return response.json();
  //       })
  //       .catch((error) => {
  //         console.log("error", error);
  //       });
  //   }
  // };
  // const handleClick = async () => {
  //   await logOut();
  //   navigate("/Home");
  // };
  
  const switchView = async () => {
    
    setDashboardToggle({
        displayToggle: true,
        toggleValue: "Admin Dashboard",
    });
    navigate("/");
}


  return (
    <nav className="w-full bg-white shadow-md ">
        <div className="w-full py-2 px-5 sm:px-20 flex justify-between md:justify-between items-center lg:h-[80px] ">
          <Link to={'/'}>
              <a class="navbar-brand" href="/">
                  <img src={TechNoobLogo} alt="technooblogo" width="150" height="50"></img>
              </a>
          </Link>

        <div className="hidden lg:flex w-[800px] justify-center">
          <ul className="flex font-normal justify-between gap-8">
            {navLinks.map((nav, i) => (
              <li key={i} className={`text-lg hover:text-[#27AE60]`}>
                <Link
                  className={`${UserProfile?.role !== "admin" && nav.id === 'switch-view' ? "hidden":""} ${active === nav.title ? "text-[#27AE60]" : ""}`}
                  to={`/${nav.link}`}
                  onClick={nav.id === 'switch-view'? switchView:handleActive }
                >
                  {nav.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex lg:hidden h-full items-center justify-center">
          <img
            src={toggle ? close : menu}
            alt="menu"
            onClick={() => setToggle((prev) => !prev)}
            className="h-4 w-4 cursor-pointer"
          />
          {/* togggle button on the nav bar for small screens */}
          <div
            className={`${
              toggle ? "flex" : "hidden"
            }  rounded-md absolute items-end top-20 right-0  my-2 w-full z-10 h-screen ${toggle ? 'sidebar' : 'sidebarClose'} flex-col `}
          >
            <div className="bg-slate-300 opacity-50 z-[-2] w-full h-full absolute "  onClick={() => setToggle((prev) => !prev)}/>
            <ul className="flex bg-white rounded-l-xl p-4 w-[80%] h-[75%] font-normal gap-7 list-none flex-col text-white">
              {navLinks.map((nav, i) => (
                <li key={i} className={`text-2xl hover:text-tblue w-full`}>
                  {}
                  <Link
                    className={`${UserProfile?.role !== "admin" && nav.id === 'switch-view' ? "hidden":""} sidebar ${"text-black border-b-2 hover:text-tblue"}`}
                    to={`/${nav.link}`}
                    onClick={() => setToggle((prev) => !prev)}
                  >
                    {nav.title}
                  </Link>
                </li>
              ))}
            </ul>
            {/* 
            <div className="flex flex-col justify-center items-center mt-10 gap-5">
            {/*  <Link*/}
            {/*    onClick={() => setToggle((prev) => !prev)}*/}
            {/*    to={"/User-Login"}*/}
            {/*  >*/}
            {/*    <button*/}
            {/*      name={"Login"}*/}
            {/*      className=" text-[#111111] bg-[#EFF0F5]   font-[600]  w-[335px] sm:w-[201px] h-[54px] text-base rounded-md py-4 px-3.5"*/}
            {/*    >*/}
            {/*      Login*/}
            {/*    </button>*/}
            {/*  </Link>*/}

            {/*  <p className="text-base font-semibold">Or</p>*/}

            {/*  <Link onClick={() => setToggle((prev) => !prev)} to={"/Sign-Up"}>*/}
            {/*    <Button name={"Get Started"} />*/}
            {/*  </Link>*/}
            {/*</div>*/}
          </div>
          {/* </div> */}

          {/* {isLoggedIn ? (
          <div className="hidden lg:flex gap-2 items-center">
            <div className="hidden lg:flex w-[20%] gap-2 text-center">
              <div className="gap-2">
                {" "}
                <h2 className="lg:text-2xl font-semibold ">
                  Welcome{" "}
                  <span className="text-tblue">
                    {UserProfile.user?.username}
                  </span>
                </h2>{" "}
              </div>
              <div>
                <Button name={"Logout"} handleClick={handleClick} />
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden gap-2 lg:flex">
            {/*<Link to={"/User-Login"}>*/}
          {/*  <button*/}
          {/*    name={"Login"}*/}
          {/*    className="w-[130px] sm:w-[130px] h-[54px] text-[#111111] bg-[#EFF0F5] rounded-md py-4 px-3.5 text-base font-[600]"*/}
          {/*  >*/}
          {/*    Login*/}
          {/*  </button>*/}
          {/*</Link>*/}
          {/*<Link to={"/Sign-Up"}>*/}
          {/*  <Button name={"Get Started"} />*/}
          {/*</Link>*/}
          {/* </div> */}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
