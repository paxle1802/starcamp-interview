# SwiftUI Patterns Reference

## View Composition

```swift
// ✅ Small, focused views — each under 60 lines
struct ProjectCard: View {
    let project: Project
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            headerSection
            progressSection
            footerSection
        }
        .padding()
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
    
    private var headerSection: some View {
        HStack {
            Text(project.name)
                .font(.headline)
            Spacer()
            StatusBadge(status: project.status)
        }
    }
    
    private var progressSection: some View {
        ProgressView(value: project.progress)
            .tint(project.status.color)
    }
    
    private var footerSection: some View {
        HStack {
            Label("\(project.tasks.count) tasks", systemImage: "checklist")
            Spacer()
            Text(project.dueDate, style: .relative)
        }
        .font(.caption)
        .foregroundStyle(.secondary)
    }
}
```

## Custom ViewModifiers

```swift
// ✅ Reusable card style
struct CardModifier: ViewModifier {
    let cornerRadius: CGFloat
    
    func body(content: Content) -> some View {
        content
            .padding()
            .background(.regularMaterial)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            .shadow(color: .black.opacity(0.1), radius: 8, y: 4)
    }
}

extension View {
    func cardStyle(cornerRadius: CGFloat = 16) -> some View {
        modifier(CardModifier(cornerRadius: cornerRadius))
    }
}

// ✅ Loading overlay
struct LoadingModifier: ViewModifier {
    let isLoading: Bool
    
    func body(content: Content) -> some View {
        content
            .disabled(isLoading)
            .overlay {
                if isLoading {
                    ZStack {
                        Color.black.opacity(0.3)
                        ProgressView()
                            .scaleEffect(1.5)
                            .tint(.white)
                    }
                    .ignoresSafeArea()
                }
            }
    }
}

extension View {
    func loading(_ isLoading: Bool) -> some View {
        modifier(LoadingModifier(isLoading: isLoading))
    }
}

// Usage
ProjectListView()
    .loading(viewModel.isLoading)
```

## Animations

```swift
// ✅ Matched geometry for smooth transitions
struct ProjectListView: View {
    @Namespace private var animationNamespace
    @State private var selectedProject: Project?
    
    var body: some View {
        if let project = selectedProject {
            ProjectDetailView(project: project, namespace: animationNamespace)
                .onTapGesture { withAnimation(.spring) { selectedProject = nil } }
        } else {
            ScrollView {
                LazyVStack {
                    ForEach(projects) { project in
                        ProjectCard(project: project)
                            .matchedGeometryEffect(id: project.id, in: animationNamespace)
                            .onTapGesture {
                                withAnimation(.spring(duration: 0.4)) {
                                    selectedProject = project
                                }
                            }
                    }
                }
            }
        }
    }
}

// ✅ Phase animator (iOS 17+)
struct PulsingDot: View {
    var body: some View {
        Circle()
            .fill(.green)
            .frame(width: 12, height: 12)
            .phaseAnimator([false, true]) { content, phase in
                content
                    .scaleEffect(phase ? 1.2 : 1.0)
                    .opacity(phase ? 0.7 : 1.0)
            } animation: { _ in
                .easeInOut(duration: 0.8)
            }
    }
}

// ✅ Keyframe animator (iOS 17+)
struct BounceButton: View {
    @State private var trigger = false
    
    var body: some View {
        Button("Save") { trigger.toggle() }
            .keyframeAnimator(initialValue: AnimationValues(), trigger: trigger) { content, value in
                content
                    .scaleEffect(value.scale)
                    .rotationEffect(value.rotation)
            } keyframes: { _ in
                KeyframeTrack(\.scale) {
                    SpringKeyframe(1.2, duration: 0.15)
                    SpringKeyframe(0.9, duration: 0.1)
                    SpringKeyframe(1.0, duration: 0.2)
                }
            }
    }
}
```

## Gestures

```swift
// ✅ Combined gestures
struct DraggableCard: View {
    @State private var offset: CGSize = .zero
    @State private var isDragging = false
    
    var body: some View {
        ProjectCard(project: project)
            .offset(offset)
            .scaleEffect(isDragging ? 1.05 : 1.0)
            .gesture(
                DragGesture()
                    .onChanged { value in
                        offset = value.translation
                        isDragging = true
                    }
                    .onEnded { value in
                        withAnimation(.spring) {
                            offset = .zero
                            isDragging = false
                        }
                    }
            )
            .sensoryFeedback(.impact, trigger: isDragging)
    }
}
```

## Accessibility

```swift
// ✅ Proper accessibility labels
struct StaffRow: View {
    let staff: Staff
    
    var body: some View {
        HStack {
            Avatar(url: staff.photoURL)
            VStack(alignment: .leading) {
                Text(staff.name)
                Text(staff.role)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            StatusIndicator(isOnline: staff.isOnline)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(staff.name), \(staff.role)")
        .accessibilityValue(staff.isOnline ? "Online" : "Offline")
        .accessibilityAddTraits(.isButton)
    }
}

// ✅ Dynamic Type support
Text(project.name)
    .font(.headline)               // Use semantic fonts
    .lineLimit(2)                   // Handle large text
    .minimumScaleFactor(0.8)        // Allow slight shrinking
```

## Environment & Dependency Injection

```swift
// ✅ Custom environment key
struct APIClientKey: EnvironmentKey {
    static let defaultValue: APIClientProtocol = APIClient()
}

extension EnvironmentValues {
    var apiClient: APIClientProtocol {
        get { self[APIClientKey.self] }
        set { self[APIClientKey.self] = newValue }
    }
}

// Inject at app level
@main
struct PainterProApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.apiClient, APIClient())
        }
        .modelContainer(for: [Project.self, Staff.self])
    }
}

// Use in any view
struct ProjectListView: View {
    @Environment(\.apiClient) private var apiClient
    
    // ...
}
```

## Common SwiftUI Mistakes

| Mistake | Fix |
|---------|-----|
| Heavy computation in `body` | Move to ViewModel or `.task` |
| `@State` for shared data | Use `@Observable` class |
| `VStack` for 1000+ items | Use `LazyVStack` |
| Missing `.id()` on ForEach | Add `Identifiable` conformance |
| Hardcoded colors/fonts | Use semantic styles & asset catalog |
| `.onAppear` for async work | Use `.task` (auto-cancels) |
| Nested NavigationStack | One NavigationStack at root |
