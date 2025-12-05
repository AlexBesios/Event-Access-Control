import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navigation() {
	const location = useLocation();

	const isActive = (path) => location.pathname === path;

	return (
		<nav className="bg-gray-900 border-b border-gray-700 mb-6 rounded-lg overflow-hidden transition-all duration-300">
			<div className="flex space-x-1 h-12 items-center justify-center">
				<Link
					to="/"
					className={`px-6 py-2.5 text-sm font-medium transition-all duration-500 ease-in-out rounded-t-md transform hover:scale-105 ${
						isActive("/")
							? "bg-gray-800 text-white border-b-2 border-indigo-500 shadow-lg"
							: "text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md"
					}`}
				>
					Register
				</Link>
				<Link
					to="/verification"
					className={`px-6 py-2.5 text-sm font-medium transition-all duration-500 ease-in-out rounded-t-md transform hover:scale-105 ${
						isActive("/verification")
							? "bg-gray-800 text-white border-b-2 border-indigo-500 shadow-lg"
							: "text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md"
					}`}
				>
					Verification
				</Link>
				<Link
					to="/members"
					className={`px-6 py-2.5 text-sm font-medium transition-all duration-500 ease-in-out rounded-t-md transform hover:scale-105 ${
						isActive("/members")
							? "bg-gray-800 text-white border-b-2 border-indigo-500 shadow-lg"
							: "text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md"
					}`}
				>
					Members
				</Link>
			</div>
		</nav>
	);
}
