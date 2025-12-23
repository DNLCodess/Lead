"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Upload,
  Check,
  Eye,
  EyeOff,
  Loader2,
  ChevronRight,
  ChevronLeft,
  MapPin,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { useLocationDetection } from "@/utils/use-location";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    country: "",
    city: "",
    phoneNumber: "",
    telegramPhone: "",
    email: "",
    password: "",
    confirmPassword: "",
    profilePicture: null,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sameAsTelegram, setSameAsTelegram] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [hasRestoredData, setHasRestoredData] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Location detection hook
  const {
    country,
    countryName,
    city,
    isLoading: locationLoading,
  } = useLocationDetection();

  const totalSteps = 3;
  const STORAGE_KEY = "registration_form_data";
  const STORAGE_STEP_KEY = "registration_form_step";

  // Load saved form data from localStorage on mount - RUNS FIRST
  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        const savedStep = localStorage.getItem(STORAGE_STEP_KEY);

        console.log("Loading saved data:", savedData); // Debug log

        if (savedData) {
          const parsedData = JSON.parse(savedData);

          // Restore form data
          setFormData({
            firstName: parsedData.firstName || "",
            lastName: parsedData.lastName || "",
            middleName: parsedData.middleName || "",
            country: parsedData.country || "",
            city: parsedData.city || "",
            phoneNumber: parsedData.phoneNumber || "",
            telegramPhone: parsedData.telegramPhone || "",
            email: parsedData.email || "",
            password: "", // Never restore passwords
            confirmPassword: "",
            profilePicture: null,
          });

          // Restore preview image
          if (parsedData.previewImageData) {
            setPreviewImage(parsedData.previewImageData);
          }

          // Restore telegram checkbox state
          if (parsedData.sameAsTelegram !== undefined) {
            setSameAsTelegram(parsedData.sameAsTelegram);
          }

          setHasRestoredData(true);
        }

        if (savedStep) {
          setCurrentStep(parseInt(savedStep, 10));
        }
      } catch (error) {
        console.error("Error loading saved form data:", error);
      } finally {
        setIsInitialLoad(false);
      }
    };

    loadSavedData();
  }, []); // Empty dependency array - only runs once on mount

  // Save form data to localStorage whenever it changes - RUNS AFTER RESTORATION
  useEffect(() => {
    // Don't save during initial load to avoid overwriting with empty values
    if (isInitialLoad) return;

    try {
      const dataToSave = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        country: formData.country,
        city: formData.city,
        phoneNumber: formData.phoneNumber,
        telegramPhone: formData.telegramPhone,
        email: formData.email,
        sameAsTelegram: sameAsTelegram,
        previewImageData: previewImage,
      };

      console.log("Saving to localStorage:", dataToSave); // Debug log
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Error saving form data:", error);
    }
  }, [formData, previewImage, sameAsTelegram, isInitialLoad]);

  // Save current step to localStorage
  useEffect(() => {
    if (isInitialLoad) return;

    try {
      localStorage.setItem(STORAGE_STEP_KEY, currentStep.toString());
    } catch (error) {
      console.error("Error saving form step:", error);
    }
  }, [currentStep, isInitialLoad]);

  // Clear localStorage on successful submission
  const clearFormStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_STEP_KEY);
    } catch (error) {
      console.error("Error clearing form storage:", error);
    }
  };

  // Manual clear function for user
  const handleClearProgress = () => {
    if (
      confirm(
        "Are you sure you want to clear your saved progress? This action cannot be undone."
      )
    ) {
      clearFormStorage();
      setFormData({
        firstName: "",
        lastName: "",
        middleName: "",
        country: "",
        city: "",
        phoneNumber: "",
        telegramPhone: "",
        email: "",
        password: "",
        confirmPassword: "",
        profilePicture: null,
      });
      setPreviewImage(null);
      setCurrentStep(1);
      setHasRestoredData(false);
      setSameAsTelegram(false);
      setIsInitialLoad(false);
    }
  };

  // Auto-fill location when detected (only once, in the background)
  useEffect(() => {
    if (
      country &&
      city &&
      !locationDetected &&
      !formData.country &&
      !formData.city
    ) {
      setFormData((prev) => ({
        ...prev,
        country: country,
        city: city,
      }));
      setLocationDetected(true);
    }
  }, [country, city, locationDetected, formData.country, formData.city]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        profilePicture: file,
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTelegramCheckbox = (checked) => {
    setSameAsTelegram(checked);
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        telegramPhone: prev.phoneNumber,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        telegramPhone: "",
      }));
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Submission logic here
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Form submitted:", formData);

      // Clear saved data on successful submission
      clearFormStorage();

      // You can redirect or show success message here
      // router.push('/success');
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Restored Data Indicator */}
            {hasRestoredData && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between gap-2 p-3 bg-[var(--accent-bg)] border border-[var(--color-green-primary)]/20 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[var(--color-green-primary)]" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    <span className="font-medium text-[var(--color-green-primary)]">
                      Progress restored:
                    </span>{" "}
                    Your previous data has been loaded
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearProgress}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Clear
                </Button>
              </motion.div>
            )}

            {/* Profile Picture Upload */}
            <motion.div
              variants={itemVariants}
              className="flex justify-center mb-8"
            >
              <div className="relative group">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-[var(--border-color)] bg-[var(--elevated)] cursor-pointer transition-all duration-300 group-hover:border-[var(--color-green-primary)] group-hover:shadow-[0_0_20px_rgba(30,215,96,0.3)]"
                  style={{ boxShadow: "var(--shadow-md)" }}
                >
                  {previewImage ? (
                    <Image
                      src={previewImage}
                      alt="Profile preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Camera className="w-12 h-12 text-[var(--text-muted)] group-hover:text-[var(--color-green-primary)] transition-colors duration-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[var(--background)]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <Upload className="w-8 h-8 text-[var(--color-green-primary)]" />
                  </div>
                </motion.div>
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </motion.div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div variants={itemVariants} className="space-y-2.5">
                <Label
                  htmlFor="firstName"
                  className="text-sm font-medium text-[var(--text-primary)]"
                >
                  First Name{" "}
                  <span className="text-[var(--color-green-primary)]">*</span>
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                  className="h-12 bg-[var(--elevated)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-green-primary)] focus:ring-1 focus:ring-[var(--color-green-primary)]/50 transition-all duration-200"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                  required
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2.5">
                <Label
                  htmlFor="lastName"
                  className="text-sm font-medium text-[var(--text-primary)]"
                >
                  Last Name{" "}
                  <span className="text-[var(--color-green-primary)]">*</span>
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  className="h-12 bg-[var(--elevated)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-green-primary)] focus:ring-1 focus:ring-[var(--color-green-primary)]/50 transition-all duration-200"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                  required
                />
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="space-y-2.5">
              <Label
                htmlFor="middleName"
                className="text-sm font-medium text-[var(--text-primary)]"
              >
                Middle Name{" "}
                <span className="text-[var(--text-secondary)] text-xs font-normal">
                  (Optional)
                </span>
              </Label>
              <Input
                id="middleName"
                name="middleName"
                value={formData.middleName}
                onChange={handleInputChange}
                placeholder="Alexander"
                className="h-12 bg-[var(--elevated)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-green-primary)] focus:ring-1 focus:ring-[var(--color-green-primary)]/50 transition-all duration-200"
                style={{ boxShadow: "var(--shadow-sm)" }}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2.5">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-[var(--text-primary)]"
              >
                Email Address{" "}
                <span className="text-[var(--color-green-primary)]">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john.doe@example.com"
                className="h-12 bg-[var(--elevated)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-green-primary)] focus:ring-1 focus:ring-[var(--color-green-primary)]/50 transition-all duration-200"
                style={{ boxShadow: "var(--shadow-sm)" }}
                required
              />
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Location Detection Indicator */}
            {locationLoading && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-[var(--accent-bg)] border border-[var(--color-green-primary)]/20 rounded-lg"
              >
                <Loader2 className="w-4 h-4 animate-spin text-[var(--color-green-primary)]" />
                <p className="text-sm text-[var(--text-secondary)]">
                  Detecting your location...
                </p>
              </motion.div>
            )}

            {locationDetected && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-[var(--accent-bg)] border border-[var(--color-green-primary)]/20 rounded-lg"
              >
                <MapPin className="w-4 h-4 text-[var(--color-green-primary)]" />
                <p className="text-sm text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--color-green-primary)]">
                    Location detected:
                  </span>{" "}
                  {countryName}, {city}
                </p>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div variants={itemVariants} className="space-y-2.5">
                <Label
                  htmlFor="country"
                  className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2"
                >
                  Country{" "}
                  <span className="text-[var(--color-green-primary)]">*</span>
                  {locationLoading && (
                    <Loader2 className="w-3 h-3 animate-spin text-[var(--color-green-primary)]" />
                  )}
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) =>
                    handleSelectChange("country", value)
                  }
                >
                  <SelectTrigger
                    className="h-12 bg-[var(--elevated)] border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--color-green-primary)] focus:ring-1 focus:ring-[var(--color-green-primary)]/50"
                    style={{ boxShadow: "var(--shadow-sm)" }}
                  >
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--surface)] border-[var(--border-color)] text-[var(--text-primary)]">
                    <SelectItem value="us">🇺🇸 United States</SelectItem>
                    <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="ca">🇨🇦 Canada</SelectItem>
                    <SelectItem value="au">🇦🇺 Australia</SelectItem>
                    <SelectItem value="ng">🇳🇬 Nigeria</SelectItem>
                    <SelectItem value="gh">🇬🇭 Ghana</SelectItem>
                    <SelectItem value="ke">🇰🇪 Kenya</SelectItem>
                    <SelectItem value="za">🇿🇦 South Africa</SelectItem>
                    <SelectItem value="in">🇮🇳 India</SelectItem>
                    <SelectItem value="de">🇩🇪 Germany</SelectItem>
                    <SelectItem value="fr">🇫🇷 France</SelectItem>
                    <SelectItem value="es">🇪🇸 Spain</SelectItem>
                    <SelectItem value="br">🇧🇷 Brazil</SelectItem>
                    <SelectItem value="mx">🇲🇽 Mexico</SelectItem>
                    <SelectItem value="jp">🇯🇵 Japan</SelectItem>
                    <SelectItem value="cn">🇨🇳 China</SelectItem>
                    <SelectItem value="sg">🇸🇬 Singapore</SelectItem>
                    <SelectItem value="ae">🇦🇪 UAE</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2.5">
                <Label
                  htmlFor="city"
                  className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2"
                >
                  City{" "}
                  <span className="text-[var(--color-green-primary)]">*</span>
                  {locationLoading && (
                    <Loader2 className="w-3 h-3 animate-spin text-[var(--color-green-primary)]" />
                  )}
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="New York"
                  className="h-12 bg-[var(--elevated)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-green-primary)] focus:ring-1 focus:ring-[var(--color-green-primary)]/50 transition-all duration-200"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                  required
                />
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="space-y-2.5">
              <Label
                htmlFor="phoneNumber"
                className="text-sm font-medium text-[var(--text-primary)]"
              >
                Phone Number{" "}
                <span className="text-[var(--color-green-primary)]">*</span>
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+1 (555) 000-0000"
                className="h-12 bg-[var(--elevated)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-green-primary)] focus:ring-1 focus:ring-[var(--color-green-primary)]/50 transition-all duration-200"
                style={{ boxShadow: "var(--shadow-sm)" }}
                required
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <div
                className="flex items-center space-x-3 p-4 bg-[var(--elevated)] border border-[var(--border-color)] rounded-lg hover:border-[var(--color-green-primary)]/40 transition-colors duration-200"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                <Checkbox
                  id="sameAsTelegram"
                  checked={sameAsTelegram}
                  onCheckedChange={handleTelegramCheckbox}
                  className="border-[var(--border-color)] data-[state=checked]:bg-[var(--color-green-primary)] data-[state=checked]:border-[var(--color-green-primary)]"
                />
                <Label
                  htmlFor="sameAsTelegram"
                  className="text-sm font-medium text-[var(--text-primary)] cursor-pointer"
                >
                  Use same number for Telegram
                </Label>
              </div>

              {!sameAsTelegram && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2.5"
                >
                  <Label
                    htmlFor="telegramPhone"
                    className="text-sm font-medium text-[var(--text-primary)]"
                  >
                    Telegram Phone Number{" "}
                    <span className="text-[var(--color-green-primary)]">*</span>
                  </Label>
                  <Input
                    id="telegramPhone"
                    name="telegramPhone"
                    type="tel"
                    value={formData.telegramPhone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    className="h-12 bg-[var(--elevated)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-green-primary)] focus:ring-1 focus:ring-[var(--color-green-primary)]/50 transition-all duration-200"
                    style={{ boxShadow: "var(--shadow-sm)" }}
                    required={!sameAsTelegram}
                  />
                </motion.div>
              )}

              {sameAsTelegram && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-[var(--accent-bg)] border border-[var(--color-green-primary)]/20 rounded-lg"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                >
                  <p className="text-sm text-[var(--text-secondary)]">
                    <span className="font-medium text-[var(--color-green-primary)]">
                      Note:
                    </span>{" "}
                    Your phone number will be used for Telegram class
                    communications.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="space-y-2.5">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-[var(--text-primary)]"
              >
                Password{" "}
                <span className="text-[var(--color-green-primary)]">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password"
                  className="h-12 pr-12 bg-[var(--elevated)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-green-primary)] focus:ring-1 focus:ring-[var(--color-green-primary)]/50 transition-all duration-200"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-[var(--border-color)]/30"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-[var(--text-muted)]" />
                  ) : (
                    <Eye className="h-5 w-5 text-[var(--text-muted)]" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <span className="w-1 h-1 bg-[var(--color-green-primary)] rounded-full" />
                Must be at least 8 characters with uppercase, lowercase, and
                numbers
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2.5">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-[var(--text-primary)]"
              >
                Confirm Password{" "}
                <span className="text-[var(--color-green-primary)]">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter your password"
                  className="h-12 pr-12 bg-[var(--elevated)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-green-primary)] focus:ring-1 focus:ring-[var(--color-green-primary)]/50 transition-all duration-200"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-[var(--border-color)]/30"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-[var(--text-muted)]" />
                  ) : (
                    <Eye className="h-5 w-5 text-[var(--text-muted)]" />
                  )}
                </Button>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="p-6 bg-gradient-to-br from-[var(--color-green-primary)]/5 to-transparent border border-[var(--color-green-primary)]/20 rounded-xl"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <h3 className="font-semibold text-lg text-[var(--text-primary)] mb-4">
                Review Your Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-[var(--border-color)]/50">
                  <span className="text-[var(--text-secondary)]">Name:</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {formData.firstName} {formData.middleName}{" "}
                    {formData.lastName}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[var(--border-color)]/50">
                  <span className="text-[var(--text-secondary)]">Email:</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {formData.email}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[var(--border-color)]/50">
                  <span className="text-[var(--text-secondary)]">
                    Location:
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {formData.city}, {formData.country}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[var(--text-secondary)]">Phone:</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {formData.phoneNumber}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Premium ambient glow - adjusted for light mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--color-green-primary)] rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.05, 0.12, 0.05],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--color-green-dark)] rounded-full blur-[100px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Card Container */}
        <div
          className="bg-[var(--surface)] rounded-2xl border border-[var(--border-color)] overflow-hidden"
          style={{ boxShadow: "var(--shadow-xl)" }}
        >
          {/* Header with Logo */}
          <div className="relative bg-[var(--elevated)] p-8 border-b border-[var(--border-color)]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center space-y-5"
            >
              <motion.div
                whileHover={{ rotate: 5, scale: 1.05 }}
                className="relative w-20 h-20 rounded-xl bg-[var(--background)] p-3 border border-[var(--border-color)]"
                style={{ boxShadow: "var(--shadow-md)" }}
              >
                <Image
                  src="/logo.png"
                  alt="Logo"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </motion.div>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                  Create Your Account
                </h1>
                <p className="text-[var(--text-secondary)]">
                  Join us and start your journey today
                </p>
              </div>
            </motion.div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mt-8 space-x-3">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: currentStep === step ? 1.1 : 1,
                      backgroundColor:
                        currentStep >= step
                          ? "var(--color-green-primary)"
                          : "var(--border-color)",
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center relative"
                    style={{ boxShadow: "var(--shadow-md)" }}
                  >
                    {currentStep > step ? (
                      <Check className="w-5 h-5 text-white dark:text-[var(--background)]" />
                    ) : (
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {step}
                      </span>
                    )}
                    {currentStep === step && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{
                          boxShadow: [
                            "0 0 0 0 rgba(30, 215, 96, 0.4)",
                            "0 0 0 8px rgba(30, 215, 96, 0)",
                          ],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                        }}
                      />
                    )}
                  </motion.div>
                  {step < 3 && (
                    <motion.div
                      initial={false}
                      animate={{
                        backgroundColor:
                          currentStep > step
                            ? "var(--color-green-primary)"
                            : "var(--border-color)",
                        width: currentStep > step ? "48px" : "40px",
                      }}
                      className="h-0.5 mx-2"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit}>
            <div className="p-8 min-h-[480px]">
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="p-8 pt-0 flex items-center justify-between gap-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="h-12 px-6 bg-[var(--elevated)] border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 hover:border-[var(--color-green-primary)]/40 transition-all duration-200"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="h-12 px-8 ml-auto bg-[var(--color-green-primary)] hover:bg-[var(--color-green-hover)] text-white font-semibold transition-all duration-200"
                  style={{ boxShadow: "0 4px 14px 0 rgba(30, 215, 96, 0.39)" }}
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 px-8 ml-auto bg-[var(--color-green-primary)] hover:bg-[var(--color-green-hover)] text-white font-semibold transition-all duration-200 disabled:opacity-50"
                  style={{ boxShadow: "0 4px 14px 0 rgba(30, 215, 96, 0.39)" }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <Check className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="px-8 pb-8 text-center border-t border-[var(--border-color)] pt-6">
            <p className="text-sm text-[var(--text-secondary)]">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-[var(--color-green-primary)] font-medium hover:text-[var(--color-green-soft)] transition-colors duration-200"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegistrationForm;
