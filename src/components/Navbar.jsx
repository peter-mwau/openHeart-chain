import React, { useState, useEffect } from "react";
import { OpenHeartConnectButton } from "../providers/provider";
import { useDarkMode } from "../contexts/themeContext";
import { Heart, Menu, X, Sun, Moon } from "lucide-react";

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { darkMode, toggleDarkMode } = useDarkMode();

  const links = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Campaigns", href: "#campaigns" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Contact", href: "#contact" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 w-[95%] max-w-6xl z-50 transition-all duration-300 ${
        darkMode
          ? "bg-gray-900/95 border-gray-700/50"
          : "bg-white/95 border-gray-200/50"
      } ${
        scrolled
          ? " backdrop-blur-lg shadow-xl rounded-2xl border border-gray-200/50"
          : "backdrop-blur-md rounded-xl border border-gray-200/30"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 py-3 transition-all duration-300">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <a
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-500 dark:to-pink-500 bg-clip-text text-transparent"
            >
              OpenHeart Chain
            </a>
          </div>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center space-x-1">
            {links.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  className={
                    darkMode
                      ? "relative px-4 py-2 text-gray-300 hover:text-red-400 font-medium rounded-lg transition-colors duration-200 group"
                      : "relative px-4 py-2 text-gray-800 hover:text-red-600 font-medium rounded-lg transition-colors duration-200 group"
                  }
                >
                  {link.name}
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-red-500 to-pink-500 group-hover:w-3/4 transition-all duration-300"></span>
                </a>
              </li>
            ))}
          </ul>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={
                darkMode
                  ? "hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors duration-200 group"
                  : "hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors duration-200 group"
              }
              aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-white hover:cursor-pointer group-hover:rotate-12 transition-transform" />
              ) : (
                <Moon className="w-5 h-5 text-red-600 hover:cursor-pointer group-hover:rotate-12 transition-transform" />
              )}
            </button>

            {/* Connect Button */}
            <div className="hidden md:block">
              <OpenHeartConnectButton />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label="Toggle navigation menu"
            >
              {open ? (
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`${
            open ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
          } md:hidden overflow-hidden transition-all duration-300 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-200 dark:border-gray-700`}
        >
          <ul className="flex flex-col p-4 space-y-1">
            {links.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 font-medium"
                  onClick={() => setOpen(false)}
                >
                  <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mr-3"></div>
                  {link.name}
                </a>
              </li>
            ))}

            {/* Mobile Dark Mode Toggle */}
            <li className="flex items-center px-4 py-3">
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-between w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
              >
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </span>
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-600" />
                )}
              </button>
            </li>

            {/* Mobile Connect Button */}
            <li className="pt-2">
              <OpenHeartConnectButton />
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
