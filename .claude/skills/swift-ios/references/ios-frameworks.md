# iOS Frameworks Reference

## CoreLocation — GPS & Location

```swift
import CoreLocation

@Observable
final class LocationManager: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    
    var currentLocation: CLLocation?
    var authorizationStatus: CLAuthorizationStatus = .notDetermined
    var error: Error?
    
    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
    }
    
    func requestPermission() {
        manager.requestWhenInUseAuthorization()
    }
    
    func startUpdating() {
        manager.startUpdatingLocation()
    }
    
    func stopUpdating() {
        manager.stopUpdatingLocation()
    }
    
    // Delegate methods
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        currentLocation = locations.last
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        self.error = error
    }
}

// Usage: Check-in with location
struct CheckInView: View {
    @State private var locationManager = LocationManager()
    
    var body: some View {
        Button("Check In") {
            if let location = locationManager.currentLocation {
                performCheckIn(
                    latitude: location.coordinate.latitude,
                    longitude: location.coordinate.longitude
                )
            }
        }
        .onAppear { locationManager.requestPermission() }
    }
}
```

## MapKit (SwiftUI)

```swift
import MapKit

struct ProjectMapView: View {
    @State private var position: MapCameraPosition = .automatic
    let projects: [Project]
    
    var body: some View {
        Map(position: $position) {
            ForEach(projects) { project in
                if let coord = project.coordinate {
                    Annotation(project.name, coordinate: coord) {
                        Image(systemName: "paintbrush.fill")
                            .foregroundStyle(project.status.color)
                            .padding(8)
                            .background(.white)
                            .clipShape(Circle())
                            .shadow(radius: 4)
                    }
                }
            }
            
            // User location
            UserAnnotation()
        }
        .mapControls {
            MapUserLocationButton()
            MapCompass()
            MapScaleView()
        }
    }
}
```

## Push Notifications

```swift
import UserNotifications

actor NotificationService {
    func requestPermission() async -> Bool {
        do {
            return try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .badge, .sound])
        } catch {
            return false
        }
    }
    
    func scheduleLocalNotification(title: String, body: String, delay: TimeInterval) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: delay, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
        
        Task {
            try? await UNUserNotificationCenter.current().add(request)
        }
    }
}

// AppDelegate for remote notifications
class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        // Send token to your server
    }
}
```

## PhotosPicker (iOS 16+)

```swift
import PhotosUI

struct ProfilePhotoView: View {
    @State private var selectedItem: PhotosPickerItem?
    @State private var profileImage: Image?
    
    var body: some View {
        VStack {
            if let profileImage {
                profileImage
                    .resizable()
                    .scaledToFill()
                    .frame(width: 120, height: 120)
                    .clipShape(Circle())
            }
            
            PhotosPicker("Select Photo", selection: $selectedItem, matching: .images)
        }
        .onChange(of: selectedItem) { _, newValue in
            Task {
                if let data = try? await newValue?.loadTransferable(type: Data.self),
                   let uiImage = UIImage(data: data) {
                    profileImage = Image(uiImage: uiImage)
                }
            }
        }
    }
}
```

## WidgetKit

```swift
import WidgetKit
import SwiftUI

struct ProjectStatusWidget: Widget {
    let kind: String = "ProjectStatusWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ProjectTimelineProvider()) { entry in
            ProjectWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Active Projects")
        .description("See your active painting projects at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct ProjectEntry: TimelineEntry {
    let date: Date
    let activeCount: Int
    let nextDueProject: String?
}

struct ProjectTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> ProjectEntry {
        ProjectEntry(date: .now, activeCount: 3, nextDueProject: "Kitchen Remodel")
    }
    
    func getSnapshot(in context: Context, completion: @escaping (ProjectEntry) -> Void) {
        completion(placeholder(in: context))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<ProjectEntry>) -> Void) {
        // Fetch real data
        let entry = ProjectEntry(date: .now, activeCount: 5, nextDueProject: "Office Paint")
        let timeline = Timeline(entries: [entry], policy: .after(.now.addingTimeInterval(3600)))
        completion(timeline)
    }
}
```

## StoreKit 2 (Subscriptions)

```swift
import StoreKit

@Observable
final class SubscriptionManager {
    var products: [Product] = []
    var purchasedProductIDs: Set<String> = []
    var isProUser: Bool { !purchasedProductIDs.isEmpty }
    
    func loadProducts() async {
        do {
            products = try await Product.products(for: [
                "com.painterpro.monthly",
                "com.painterpro.yearly"
            ])
        } catch {
            print("Failed to load products: \(error)")
        }
    }
    
    func purchase(_ product: Product) async throws -> Transaction? {
        let result = try await product.purchase()
        
        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            purchasedProductIDs.insert(transaction.productID)
            await transaction.finish()
            return transaction
        case .pending, .userCancelled:
            return nil
        @unknown default:
            return nil
        }
    }
    
    func listenForTransactions() async {
        for await result in Transaction.updates {
            if let transaction = try? checkVerified(result) {
                purchasedProductIDs.insert(transaction.productID)
                await transaction.finish()
            }
        }
    }
    
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified: throw StoreError.verificationFailed
        case .verified(let value): return value
        }
    }
}
```

## Charts (Swift Charts)

```swift
import Charts

struct EarningsChartView: View {
    let weeklyEarnings: [WeeklyEarning]
    
    var body: some View {
        Chart(weeklyEarnings) { earning in
            BarMark(
                x: .value("Week", earning.weekLabel),
                y: .value("Earnings", earning.amount)
            )
            .foregroundStyle(earning.amount > 1000 ? .green : .blue)
            .annotation(position: .top) {
                Text("$\(earning.amount, specifier: "%.0f")")
                    .font(.caption2)
            }
        }
        .chartYAxis {
            AxisMarks(format: .currency(code: "USD"))
        }
        .frame(height: 200)
    }
}

struct WeeklyEarning: Identifiable {
    let id = UUID()
    let weekLabel: String
    let amount: Double
}
```

## Key Info.plist Entries

| Key | Purpose | When |
|-----|---------|------|
| `NSLocationWhenInUseUsageDescription` | Location permission | GPS check-in |
| `NSCameraUsageDescription` | Camera access | Photo capture |
| `NSPhotoLibraryUsageDescription` | Photo library | Profile photos |
| `UIBackgroundModes` | Background tasks | Location tracking |
| `NSFaceIDUsageDescription` | Biometric auth | Secure login |
