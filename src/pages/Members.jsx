import React, { useState, useEffect, useCallback } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import Navigation from "@/components/Navigation";

export default function Members() {
	const [members, setMembers] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [message, setMessage] = useState("");
	const [deleteDialog, setDeleteDialog] = useState({
		isOpen: false,
		memberId: null,
		memberName: "",
	});

	const fetchMembers = useCallback(async (search = "") => {
		try {
			const url = search
				? `http://localhost:3001/api/members?search=${encodeURIComponent(search)}`
				: "http://localhost:3001/api/members";
			const response = await fetch(url);
			const data = await response.json();
			setMembers(data.members);
		} catch (err) {
			setMessage("Failed to load members: " + err.message);
		}
	}, []);

	useEffect(() => {
		fetchMembers();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			fetchMembers(searchTerm);
		}, 300);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchTerm]);

	const filteredMembers = members;

	const openDeleteDialog = (memberId, firstName, lastName) => {
		setDeleteDialog({
			isOpen: true,
			memberId,
			memberName: `${firstName} ${lastName}`,
		});
	};

	const closeDeleteDialog = () => {
		setDeleteDialog({
			isOpen: false,
			memberId: null,
			memberName: "",
		});
	};

	const confirmDelete = async () => {
		const memberId = deleteDialog.memberId;
		closeDeleteDialog();

		try {
			const response = await fetch(
				`http://localhost:3001/api/members/${memberId}`,
				{
					method: "DELETE",
				}
			);

			if (response.ok) {
				setMessage("Member deleted successfully");
				fetchMembers();
				setTimeout(() => setMessage(""), 3000);
			} else {
				const result = await response.json();
				setMessage(`Failed to delete member: ${result.detail}`);
			}
		} catch (err) {
			setMessage(`Error deleting member: ${err.message}`);
		}
	};

	return (
		<div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
			{deleteDialog.isOpen && (
				<div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200 border-2 border-gray-300">
						<h3 className="text-lg font-semibold mb-2 text-gray-900">
							Delete Member
						</h3>
						<p className="text-gray-600 mb-6">
							Are you sure you want to delete{" "}
							<span className="font-semibold">
								{deleteDialog.memberName}
							</span>
							?
						</p>
						<div className="flex gap-3 justify-end">
							<Button
								variant="outline"
								onClick={closeDeleteDialog}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={confirmDelete}
							>
								Delete
							</Button>
						</div>
					</div>
				</div>
			)}
			<div className="container mx-auto max-w-4xl flex flex-col items-center justify-center h-screen">
				<div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
					<Navigation />
					<Card className="h-[600px] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 backdrop-blur-sm">
						<CardHeader className="border-b border-gray-100 pb-4">
							<CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
								Registered Members
							</CardTitle>
							<CardDescription className="text-base text-gray-600">
								View all registered members
							</CardDescription>
						</CardHeader>
						<CardContent className="h-[calc(100%-120px)] overflow-y-auto">{message && (
								<Alert className="mb-4 bg-red-50 border-red-200 animate-in fade-in slide-in-from-top-2 duration-300">
									<AlertDescription className="text-red-800">
										{message}
									</AlertDescription>
								</Alert>
							)}

							<div className="mb-4 animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
								<Input
									type="text"
									placeholder="Search by name, email, phone, or ID..."
									value={searchTerm}
									onChange={(e) =>
										setSearchTerm(e.target.value)
									}
									className="max-w-md"
								/>
							</div>

							{filteredMembers.length === 0 ? (
								<p className="text-gray-600 animate-in fade-in duration-500">
									{searchTerm
										? "No members found matching your search."
										: "No members registered yet."}
								</p>
							) : (
								<div className="space-y-4">
									{filteredMembers.map((member, index) => (
										<div
											key={member.id}
											className="border-2 border-gray-200 rounded-xl p-5 bg-white shadow-lg hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-right-4"
											style={{
												animationDelay: `${index * 100}ms`,
												animationDuration: '500ms'
											}}
										>
											<div className="flex gap-4">
											{member.photo && (
												<div className="flex-shrink-0">
													<img
														src={member.photo}
														alt={`${member.first_name} ${member.last_name}`}
														className="w-24 h-24 rounded-xl object-cover border-4 border-indigo-200 shadow-lg"
													/>
												</div>
											)}
												<div className="flex-1 grid grid-cols-2 gap-2">
													<div>
														<p className="text-sm text-gray-500">
															Name
														</p>
														<p className="font-medium">
															{member.first_name}{" "}
															{member.last_name}
														</p>
													</div>
													<div>
														<p className="text-sm text-gray-500">
															Email
														</p>
														<p className="font-medium">
															{member.email}
														</p>
													</div>
													{member.phone && (
														<div>
															<p className="text-sm text-gray-500">
																Phone
															</p>
															<p className="font-medium">
																{member.phone}
															</p>
														</div>
													)}
													<div>
														<p className="text-sm text-gray-500">
															ID
														</p>
														<p className="font-medium">
															#{member.id}
														</p>
													</div>
												</div>
												<div className="flex-shrink-0">
													<Button
														variant="destructive"
														size="icon"
														onClick={() =>
															openDeleteDialog(
																member.id,
																member.first_name,
																member.last_name
															)
														}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
