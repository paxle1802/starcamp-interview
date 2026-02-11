# App Store Deployment Reference

## TestFlight Distribution

### Internal Testing (up to 100 testers)
1. Archive in Xcode: `Product → Archive`
2. Upload to App Store Connect
3. Add internal testers (Apple ID email)
4. Testers get notified automatically

### External Testing (up to 10,000 testers)
1. Submit build for Beta App Review
2. Create public TestFlight link or invite by email
3. Collect feedback via TestFlight app
4. Iterate and upload new builds

## App Store Review Guidelines (Key Points)

### Common Rejection Reasons
1. **Crashes and bugs** — Test on real devices thoroughly
2. **Broken links** — All URLs must work
3. **Placeholder content** — No Lorem Ipsum or test data
4. **Incomplete information** — All metadata fields filled
5. **Privacy policy missing** — Required for all apps
6. **Login required without demo account** — Provide reviewer credentials
7. **In-app purchase issues** — Must use Apple's IAP for digital content

### Required Assets

| Asset | Specification |
|-------|--------------|
| App Icon | 1024×1024px, no transparency, no rounded corners |
| iPhone Screenshots | 6.7" (1290×2796), 6.5" (1284×2778), 5.5" (1242×2208) |
| iPad Screenshots | 12.9" (2048×2732) — if supporting iPad |
| App Preview Video | 15-30 seconds, .mov or .mp4 |

### Metadata Checklist
- [ ] App name (30 chars max)
- [ ] Subtitle (30 chars max)
- [ ] Description (4000 chars max, first 3 lines most important)
- [ ] Keywords (100 chars, comma-separated)
- [ ] Support URL
- [ ] Privacy policy URL
- [ ] App category & subcategory
- [ ] Age rating questionnaire
- [ ] Copyright info
- [ ] Contact information

## Privacy & Data Collection

### App Privacy Labels (Required)
Declare what data your app collects in App Store Connect:
- **Contact Info**: Name, email, phone
- **Location**: Precise/coarse location
- **Identifiers**: User ID, device ID
- **Usage Data**: Analytics, crash data
- **Financial Info**: Payment method (if applicable)

### Privacy Manifest (Required since Spring 2024)
```xml
<!-- PrivacyInfo.xcprivacy -->
<?xml version="1.0" encoding="UTF-8"?>
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeName</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
    </array>
</dict>
```

## CI/CD with Xcode Cloud

```yaml
# Basic workflow
Workflow: "Release Build"
Start Conditions:
  - Branch: main
  - Tag: v*
Actions:
  - Build (Release)
  - Test (Unit + UI)
  - Archive
  - Deploy to TestFlight
Post-Actions:
  - Notify team on Slack
```

### Alternative: Fastlane

```ruby
# Fastfile
default_platform(:ios)

platform :ios do
  desc "Push a new beta build to TestFlight"
  lane :beta do
    increment_build_number
    build_app(scheme: "PainterPro")
    upload_to_testflight
    slack(message: "New beta build uploaded!")
  end

  desc "Push a new release to App Store"
  lane :release do
    build_app(scheme: "PainterPro")
    upload_to_app_store(
      skip_metadata: false,
      skip_screenshots: false
    )
  end
end
```

## Version & Build Numbers

```swift
// Semantic versioning for marketing version
// Format: MAJOR.MINOR.PATCH
// Example: 1.0.0 → 1.0.1 (bug fix) → 1.1.0 (feature) → 2.0.0 (breaking)

// Build number: auto-increment
// Can use date-based: YYYYMMDD.N (20260211.1)
```

**Xcode Build Settings:**
- `MARKETING_VERSION` = 1.0.0 (shown on App Store)
- `CURRENT_PROJECT_VERSION` = 1 (auto-increment per upload)

## Pre-Submission Checklist

- [ ] All features working on physical device
- [ ] No crashes in Xcode Organizer crash logs
- [ ] Dark mode tested
- [ ] Dynamic Type (accessibility text sizes) tested
- [ ] VoiceOver accessibility tested
- [ ] No hardcoded API keys or credentials
- [ ] Privacy manifest up to date
- [ ] App icon and screenshots prepared
- [ ] Demo account credentials ready for reviewer
- [ ] Release notes written
- [ ] Support URL accessible
- [ ] Privacy policy URL accessible
- [ ] All third-party SDKs have privacy manifests
- [ ] Minimum deployment target set correctly
