import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navigation from "@/components/Navigation";
import API_URL from "@/config";

export default function Register() {
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
	});
	const [image, setImage] = useState(null);
	const [imageFile, setImageFile] = useState(null);
	const [showCamera, setShowCamera] = useState(false);
	const [message, setMessage] = useState("");

	const videoRef = useRef(null);
	const streamRef = useRef(null);
	const fileInputRef = useRef(null);

	const handleInputChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const startCamera = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: true,
			});

			streamRef.current = stream;
			setShowCamera(true);

			setTimeout(() => {
				if (videoRef.current && streamRef.current) {
					videoRef.current.srcObject = streamRef.current;
				}
			}, 100);
		} catch (err) {
			setMessage("Unable to access camera: " + err.message);
		}
	};

	const stopCamera = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
		setShowCamera(false);
	}, []);

	const submitRegistration = useCallback(async (photoData = image) => {
		if (!photoData) {
			setMessage("Please capture or upload a photo");
			return;
		}

		try {
			setMessage("Submitting registration...");

			const formDataToSend = new FormData();
			formDataToSend.append("first_name", formData.firstName);
			formDataToSend.append("last_name", formData.lastName);
			formDataToSend.append("email", formData.email);
			formDataToSend.append("phone", formData.phone || "");

			if (imageFile) {
				formDataToSend.append("image", imageFile);
			} else {
				formDataToSend.append("camera_image", photoData);
			}

			const response = await fetch(`${API_URL}/api/members/register`, {
				method: "POST",
				body: formDataToSend,
			});

			const result = await response.json();

			if (response.ok) {
				setMessage("Registration successful! ✓");
				setTimeout(() => {
					setFormData({
						firstName: "",
						lastName: "",
						email: "",
						phone: "",
					});
					setImage(null);
					setImageFile(null);
					setMessage("");
				}, 2000);
			} else {
				setMessage(`Registration failed: ${result.detail}`);
			}
		} catch (err) {
			setMessage(`Error: ${err.message}`);
		}
	}, [image, formData, imageFile]);

	const capturePhoto = useCallback(async () => {
		if (videoRef.current) {
			const canvas = document.createElement("canvas");
			canvas.width = videoRef.current.videoWidth;
			canvas.height = videoRef.current.videoHeight;
			const ctx = canvas.getContext("2d");
			ctx.translate(canvas.width, 0);
			ctx.scale(-1, 1);
			ctx.drawImage(videoRef.current, 0, 0);
			const imageData = canvas.toDataURL("image/jpeg");
			setImage(imageData);
			stopCamera();

			await submitRegistration(imageData);
		}
	}, [submitRegistration, stopCamera]);

	useEffect(() => {
		const handleKeyPress = (e) => {
			if (e.key === " " && showCamera) {
				e.preventDefault();
				capturePhoto();
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, [showCamera, capturePhoto]);

	const handleFileUpload = (e) => {
		const file = e.target.files[0];
		if (file) {
			setImageFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setImage(reader.result);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleRegisterWithCamera = async () => {
		if (!formData.firstName || !formData.lastName || !formData.email) {
			setMessage("Please fill in all required fields");
			return;
		}
		await startCamera();
	};

	const handleRegisterWithFile = () => {
		if (!formData.firstName || !formData.lastName || !formData.email) {
			setMessage("Please fill in all required fields");
			return;
		}
		fileInputRef.current?.click();
	};

	const removeImage = () => {
		setImage(null);
		setMessage("");
	};

	return (
		<div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
			<div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
				<Navigation />
				<Card className="w-full h-[600px] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 backdrop-blur-sm">
					<CardHeader className="border-b border-gray-100 pb-4">
						<CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
							Registration Form
						</CardTitle>
						<CardDescription className="text-base text-gray-600">
							Please fill in your details to register
						</CardDescription>
					</CardHeader>
					<CardContent className="h-[calc(100%-120px)] overflow-y-auto space-y-4">
						{message && (
							<Alert className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
								<AlertDescription className="text-red-800 font-medium">
									{message}
								</AlertDescription>
							</Alert>
						)}

				{!showCamera && !image && (
					<div className="animate-in fade-in slide-in-from-left-4 duration-500 bg-gray-50 p-6 rounded-xl shadow-lg border border-gray-200">
						<div className="mb-4">
							<Label htmlFor="firstName">
								First Name
							</Label>
							<Input
								id="firstName"
								name="firstName"
								value={formData.firstName}
								onChange={handleInputChange}
								placeholder="Enter first name"
							/>
						</div>

						<div className="mb-4">
							<Label htmlFor="lastName">Last Name</Label>
							<Input
								id="lastName"
								name="lastName"
								value={formData.lastName}
								onChange={handleInputChange}
								placeholder="Enter last name"
							/>
						</div>

						<div className="mb-4">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								value={formData.email}
								onChange={handleInputChange}
								placeholder="Enter email"
							/>
						</div>

						<div className="mb-4">
							<Label htmlFor="phone">Phone Number</Label>
							<Input
								id="phone"
								name="phone"
								type="tel"
								value={formData.phone}
								onChange={handleInputChange}
								placeholder="Enter phone number (optional)"
							/>
						</div>								<div className="grid grid-cols-2 gap-3 pt-4">
									<Button
										onClick={handleRegisterWithCamera}
										className="w-full"
									>
										<Camera className="mr-2 h-4 w-4" />
										Register with Camera
									</Button>
									<Button
										onClick={handleRegisterWithFile}
										variant="outline"
										className="w-full"
									>
										<Upload className="mr-2 h-4 w-4" />
										Register with File
									</Button>
								</div>

								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handleFileUpload}
										className="hidden"
									/>
							</div>
						)}						{showCamera && (
							<div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
								<div className="text-center text-sm font-medium text-indigo-600 bg-indigo-50 py-2 px-4 rounded-lg mb-2">
									📸 Press SPACE to capture photo
								</div>
								<div className="relative rounded-xl overflow-hidden bg-black shadow-2xl border-4 border-indigo-200">
									<video
										ref={videoRef}
										autoPlay
										playsInline
										muted
										className="w-full"
										style={{ transform: "scaleX(-1)" }}
									/>
								</div>
								<div className="flex gap-2">
									<Button
										onClick={capturePhoto}
										className="flex-1"
									>
										<Camera className="mr-2 h-4 w-4" />
										Capture Photo
									</Button>
									<Button
										onClick={stopCamera}
										variant="outline"
									>
										Cancel
									</Button>
								</div>
							</div>
						)}

						{image && (
							<div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
								<div className="relative">
									<img
										src={image}
										alt="Captured"
										className="w-full rounded-xl shadow-2xl border-4 border-green-200"
									/>
									<Button
										onClick={removeImage}
										variant="destructive"
										size="icon"
										className="absolute top-2 right-2"
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
								<Button
									onClick={submitRegistration}
									className="w-full"
								>
									Complete Registration
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
