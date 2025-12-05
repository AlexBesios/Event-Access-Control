import React from "react";
import { Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Verification from "./pages/Verification";
import Members from "./pages/Members";

export default function App() {
	return (
		<Routes>
			<Route path="/" element={<Register />} />
			<Route path="/verification" element={<Verification />} />
			<Route path="/members" element={<Members />} />
		</Routes>
	);
}
