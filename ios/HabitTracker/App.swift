import SwiftUI

@main
struct HabitTrackerApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .background(Color(red: 0.972, green: 0.980, blue: 0.972))
                .ignoresSafeArea(.all, edges: .bottom)
        }
    }
}
