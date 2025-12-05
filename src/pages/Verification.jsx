import React, { useState, useRef, useEffect, useCallback } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navigation from "@/components/Navigation";
import { Camera, UserCheck, ArrowLeft, CheckCircle } from "lucide-react";

export default function Verification() {
	const [mode, setMode] = useState(null);
	const [stream, setStream] = useState(null);
	const [message, setMessage] = useState("");
	const [isCheckedIn, setIsCheckedIn] = useState(false);
	const [members, setMembers] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [checkInMessage, setCheckInMessage] = useState("");
	const videoRef = useRef(null);
	const canvasRef = useRef(null);

	useEffect(() => {
		return () => {
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}
		};
	}, [stream]);

	const captureAndVerify = useCallback(async () => {
		if (!videoRef.current || !canvasRef.current) return;

		const canvas = canvasRef.current;
		const video = videoRef.current;

		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const context = canvas.getContext("2d");
		context.drawImage(video, 0, 0);

		const imageData = canvas.toDataURL("image/jpeg");

		setMessage("Verifying...");

		try {
			const response = await fetch("http://localhost:8000/api/verify", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ camera_image: imageData }),
			});

			const result = await response.json();

			if (response.ok && result.recognized) {
				if (stream) {
					stream.getTracks().forEach((track) => track.stop());
					setStream(null);
				}
				setMessage(`${result.name} checked in`);
				setIsCheckedIn(true);
			} else {
				setMessage(
					result.detail || "Face not recognized. Please try again."
				);
			}
		} catch (err) {
			setMessage(`Error: ${err.message}`);
		}
	}, [stream]);

	const startCamera = async () => {
		try {
			setMessage("Starting camera...");
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: { width: 640, height: 480 },
			});
			setStream(mediaStream);

			setTimeout(() => {
				if (videoRef.current) {
					videoRef.current.srcObject = mediaStream;
					videoRef.current.muted = true;
					videoRef.current.onloadedmetadata = () => {
						videoRef.current.play().catch(() => {
							setMessage(
								"Error playing video. Please try again."
							);
						});
						setMessage("Scanning for face...");
						setTimeout(() => {
							if (
								videoRef.current &&
								videoRef.current.readyState === 4
							) {
								captureAndVerify();
							}
						}, 3000);
					};
				}
			}, 100);
		} catch {
			setMessage(
				"Camera access denied or not available. Please use Admin Check-in."
			);
		}
	};

	const handleCameraCheckIn = () => {
		setMode("camera");
		setMessage("");
		setIsCheckedIn(false);
	};

	useEffect(() => {
		if (mode === "camera" && !stream && !isCheckedIn) {
			setTimeout(() => {
				startCamera();
			}, 100);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode]);

	const handleAdminCheckIn = async () => {
		setMode("admin");
		setMessage("");
		setIsCheckedIn(false);
		setCheckInMessage("");
		await fetchMembers();
	};

	const fetchMembers = async (search = "") => {
		try {
			const url = search
				? `http://localhost:8000/api/members?search=${encodeURIComponent(search)}`
				: "http://localhost:8000/api/members";
			const response = await fetch(url);
			const data = await response.json();
			setMembers(data.members || []);
		} catch {
			// Ignore fetch errors
		}
	};

	const handleMemberCheckIn = (member) => {
		setCheckInMessage(
			`${member.first_name} ${member.last_name} checked in`
		);
		setTimeout(() => {
			setCheckInMessage("");
		}, 3000);
	};

	const handleBack = () => {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			setStream(null);
		}
		setMode(null);
		setMessage("");
		setIsCheckedIn(false);
	};

	useEffect(() => {
		const handleKeyPress = (e) => {
			if (
				e.code === "Space" &&
				mode === "camera" &&
				stream &&
				!isCheckedIn
			) {
				e.preventDefault();
				captureAndVerify();
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, [mode, stream, isCheckedIn, captureAndVerify]);

	useEffect(() => {
		if (mode === "admin") {
			const timer = setTimeout(() => {
				fetchMembers(searchTerm);
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [searchTerm, mode]);

	return (
		<div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
			<div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
				<Navigation />
				<Card className="w-full h-[600px] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
					<CardHeader>
						<CardTitle className="text-2xl">Verification</CardTitle>
						<CardDescription>Verify member access</CardDescription>
					</CardHeader>
					<CardContent className="h-[calc(100%-100px)] overflow-y-auto space-y-4">{!mode && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-500">
								<Button
									onClick={handleCameraCheckIn}
									className="h-32 text-lg"
									variant="default"
								>
									<Camera className="mr-2 h-6 w-6" />
									Check In with Camera
								</Button>

								<Button
									onClick={handleAdminCheckIn}
									className="h-32 text-lg"
									variant="outline"
								>
									<UserCheck className="mr-2 h-6 w-6" />
									Check In with Admin
								</Button>
							</div>
						)}

						{mode === 'camera' && (
							<div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
								<Button onClick={handleBack} variant="outline">
									<ArrowLeft className="mr-2 h-4 w-4" />
									Back
								</Button>

								{!isCheckedIn && stream && (
									<div className="relative">
										<video
											ref={videoRef}
											className="w-full rounded-lg border-2 border-gray-300"
											autoPlay
											playsInline
											muted
										/>
										<canvas
											ref={canvasRef}
											className="hidden"
										/>
									</div>
								)}

								{message && (
									<Alert
										className={
											isCheckedIn
												? "bg-green-50 border-green-200 animate-in fade-in zoom-in-95 duration-500"
												: "bg-red-50 border-red-200 animate-in fade-in slide-in-from-top-2 duration-300"
										}
									>
										<AlertDescription
											className={
												isCheckedIn
													? "text-green-800 text-xl font-semibold"
													: "text-red-800"
											}
										>
											{message}
										</AlertDescription>
									</Alert>
								)}

								{!isCheckedIn && stream && (
									<Button
										onClick={captureAndVerify}
										className="w-full"
										size="lg"
									>
										Verify Face (or press Space)
									</Button>
								)}
							</div>
						)}

						{mode === 'admin' && (
							<div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
								<Button onClick={handleBack} variant="outline">
									<ArrowLeft className="mr-2 h-4 w-4" />
									Back
								</Button>

								{checkInMessage && (
									<Alert className="bg-green-50 border-green-200 animate-in fade-in slide-in-from-top-2 duration-300">
										<AlertDescription className="text-green-800 text-xl font-semibold">
											{checkInMessage}
										</AlertDescription>
									</Alert>
								)}

								<div className="mb-4 animate-in fade-in slide-in-from-left-2 duration-500 delay-150">
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

							{members.length === 0 ? (
								<p className="text-gray-600">
									{searchTerm
										? "No members found matching your search."
										: "No members registered yet."}
								</p>
							) : (
								<div className="space-y-4">
									{members.map((member, index) => (
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
																src={
																	member.photo
																}
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
																{
																	member.first_name
																}{" "}
																{
																	member.last_name
																}
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
																	{
																		member.phone
																	}
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
															variant="default"
															size="icon"
															onClick={() =>
																handleMemberCheckIn(
																	member
																)
															}
														>
															<CheckCircle className="h-4 w-4" />
														</Button>
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
