/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/authContext";
import styles from "./Sidebar.module.css";
import { getUserChannelPic } from "@/sevices/getUserData";

const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [profilePic, setProfilePic] = useState("");

  useEffect(() => {
    const setPic = async() => {
        setProfilePic(await getUserChannelPic(user?.uid as string));
    }
    setPic();
  });

  const navItems = [
    { title: "My Channel", path: "/" },
    { title: "Create a question", path: "/question" },
    { title: "Settings", path: "/settings" },
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.profileSection}>
        <div className={styles.avatar}>
          {profilePic ? (
            <img src={profilePic} alt="Profile" />
          ) : (
            <img src={`https://robohash.org/${user?.uid}`} alt="Profile" />
          )}
        </div>
        <div className={styles.userInfo}>
          <h3>{user?.displayName || user?.email || "User"}</h3>
        </div>
      </div>

      <nav className={styles.navigation}>
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <div
                  className={`${styles.navItem} ${
                    pathname === item.path ? styles.active : ""
                  }`}
                >
                  <span>{item.title}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.sidebarFooter}></div>
    </div>
  );
};

export default Sidebar;
