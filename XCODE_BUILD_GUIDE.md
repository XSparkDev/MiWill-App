# Xcode Build Guide for MiWill App

## ✅ Completed Setup

1. **iOS App Icons Generated** ✅
   - Created 18 different icon sizes from your `appstorelogo.png`
   - All icons copied to `ios/MiWill/Images.xcassets/AppIcon.appiconset/`
   - Contents.json properly configured

2. **iOS Project Created** ✅
   - Generated native iOS project using `expo prebuild`
   - CocoaPods dependencies installed
   - React Native and Expo modules configured

3. **Xcode Workspace Opened** ✅
   - Workspace: `ios/MiWill.xcworkspace`
   - Bundle ID: `com.miwill.app`
   - Display Name: MiWill
   - Version: 1.0.0
   - Build Number: 1

## 📱 Next Steps in Xcode (For Development Build)

### 1. Configure Signing (Required)

In Xcode, with `MiWill.xcworkspace` open:

1. **Select the Project**
   - Click on "MiWill" in the left sidebar (blue icon)
   
2. **Select the Target**
   - Click on "MiWill" under TARGETS (not PROJECTS)
   
3. **Go to "Signing & Capabilities" Tab**
   
4. **For Development Build:**
   - ✅ Check "Automatically manage signing"
   - Select your **Team** (your Apple Developer account)
     - If you don't see your team, click "Add Account..." and sign in
   - Build Configuration: **Debug** (for development)
   
5. **Choose a Device/Simulator:**
   - At the top of Xcode, next to the scheme dropdown
   - Select either:
     - An iOS Simulator (e.g., "iPhone 15 Pro")
     - Your physical device (if connected)

### 2. Verify App Icons

1. **Check Asset Catalog:**
   - In Xcode left sidebar, navigate to: `MiWill` → `Images.xcassets` → `AppIcon`
   - You should see all your app icons displayed

### 3. Build and Run

1. **Click the Play Button** (▶️) at the top left of Xcode
   - OR press `Cmd + R`
   
2. **Wait for Build:**
   - First build takes 5-10 minutes (downloading dependencies)
   - Subsequent builds are much faster

3. **App Will Launch:**
   - On simulator or your device
   - Test all features

## 🏪 For App Store Connect (Distribution Build)

When ready to submit to App Store:

### 1. Switch to Release Configuration

1. **Product** → **Scheme** → **Edit Scheme...**
2. Select **Run** in left sidebar
3. Change **Build Configuration** to **Release**

### 2. Update Signing for Distribution

1. **Signing & Capabilities** tab
2. **Uncheck** "Automatically manage signing" (or keep it checked if preferred)
3. Select **Provisioning Profile**: "App Store" or "AdHoc"
4. Select **Team**: Your Apple Developer team
5. **Certificate**: "Apple Distribution" (not "Apple Development")

### 3. Archive the App

1. **Product** → **Archive**
   - Xcode will build and create an archive
   
2. **Organizer Window Opens:**
   - Your archive appears in the list
   
3. **Click "Distribute App"**
   - Choose "App Store Connect"
   - Follow the wizard:
     - Upload
     - Include bitcode: Yes (if available)
     - Upload symbols: Yes
     - Automatically manage signing: Choose based on preference
   
4. **Wait for Upload:**
   - Can take 5-15 minutes
   - You'll get a success message

### 4. In App Store Connect

1. **Go to** [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **My Apps** → Create new app (if not exists)
3. **Fill in metadata:**
   - App Name: MiWill
   - Privacy Policy URL
   - App Description
   - Screenshots (required)
   - Keywords
   - Support URL
   - Marketing URL (optional)
   - Category: Lifestyle or Finance
   
4. **Select the Build:**
   - After upload, build appears in "TestFlight" section
   - Takes 5-30 minutes to process
   - Once processed, add to your version
   
5. **Submit for Review:**
   - Complete all required fields
   - Click "Submit for Review"
   - Apple reviews in 24-48 hours typically

## 🔧 Troubleshooting

### Build Errors

- **"No signing certificate"**: Add your Apple Developer account in Xcode Preferences → Accounts
- **"Provisioning profile doesn't include signing certificate"**: Download profiles in Xcode Preferences → Accounts → Download Manual Profiles
- **"Bundle identifier cannot be used"**: Change bundle ID in `app.json` and run `npx expo prebuild --clean`

### Pod Install Errors

```bash
cd /Users/xspark2/Desktop/MiWill-App/ios
export LANG=en_US.UTF-8
pod install
```

### Clean Build

If build fails:
1. **Product** → **Clean Build Folder** (Shift + Cmd + K)
2. Quit Xcode
3. Delete: `ios/build` directory
4. Delete: `~/Library/Developer/Xcode/DerivedData/MiWill-*`
5. Reopen Xcode and build again

## 📋 Project Configuration Summary

- **Bundle Identifier:** `com.miwill.app`
- **Display Name:** MiWill
- **Version:** 1.0.0
- **Build Number:** 1
- **Minimum iOS Version:** 12.0
- **Deployment Target:** iOS 12.0+
- **Supported Devices:** iPhone, iPad
- **Orientation:** Portrait only
- **New Architecture:** Enabled (React Native 0.81.5)

## 🎯 Current Build Configuration

The project is currently configured for **Development**:
- Configuration: **Debug**
- Code Signing: **Development** (manual signing required)
- Deployment: **Simulator** or **Development Device**

To switch to Distribution for App Store, follow the "For App Store Connect" section above.

## 📱 Required Privacy Descriptions (Already Added)

- **Camera Usage:** "The app accesses your camera to capture documents."
- **Photo Library Usage:** "The app accesses your photos to upload profile pictures and documents."
- **Microphone Usage:** "Allow MiWill to access your microphone"

These are required for App Store approval and are already configured in `Info.plist`.

## 🔐 Important for App Store Submission

1. **Privacy Policy:** You'll need a hosted privacy policy URL
2. **Support URL:** Website or contact page for user support  
3. **App Screenshots:** Required for all device sizes you support
4. **App Preview Video:** Optional but recommended
5. **Age Rating:** Complete the questionnaire in App Store Connect
6. **Export Compliance:** If app uses encryption, declare it

---

**Generated:** November 13, 2025  
**Project:** MiWill App  
**Platform:** iOS



