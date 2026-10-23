import SwiftUI
import WebKit

struct ContentView: View {
    @State private var isLoading = true
    @State private var hasError = false
    @State private var reloadToken = UUID()

    private let appURL = URL(string: "https://habit.thanhtungvo.id.vn")!

    var body: some View {
        ZStack {
            Color(red: 0.972, green: 0.980, blue: 0.972)
                .ignoresSafeArea()

            if hasError {
                VStack(spacing: 16) {
                    Image(systemName: "wifi.slash")
                        .font(.system(size: 48))
                        .foregroundColor(Color(red: 0.208, green: 0.427, blue: 0.357))

                    Text("Không thể kết nối máy chủ")
                        .font(.headline)
                        .foregroundColor(.primary)

                    Text("Vui lòng kiểm tra kết nối mạng và thử lại.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)

                    Button(action: {
                        hasError = false
                        reloadToken = UUID()
                    }) {
                        HStack {
                            Image(systemName: "arrow.clockwise")
                            Text("Thử lại")
                        }
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(Color(red: 0.208, green: 0.427, blue: 0.357))
                        .cornerRadius(10)
                    }
                    .padding(.top, 8)
                }
            } else {
                WebViewRepresentable(
                    url: appURL,
                    reloadToken: reloadToken,
                    isLoading: ,
                    hasError: 
                )
                .ignoresSafeArea(.keyboard, edges: .bottom)
            }
        }
    }
}
