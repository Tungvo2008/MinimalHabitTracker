import SwiftUI
import WebKit
import UIKit

struct WebViewRepresentable: UIViewRepresentable {
    let url: URL
    let reloadToken: UUID
    @Binding var isLoading: Bool
    @Binding var hasError: Bool

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.applicationNameForUserAgent = "HabitTrackerNativeIOS/1.0"

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.972, green: 0.980, blue: 0.972, alpha: 1.0)
        webView.scrollView.backgroundColor = UIColor(red: 0.972, green: 0.980, blue: 0.972, alpha: 1.0)
        webView.scrollView.bounces = true
        webView.scrollView.alwaysBounceVertical = true

        // Pull to refresh with subtle haptic feedback
        let refreshControl = UIRefreshControl()
        refreshControl.tintColor = UIColor(red: 0.208, green: 0.427, blue: 0.357, alpha: 1.0)
        refreshControl.addTarget(context.coordinator, action: #selector(Coordinator.handleRefresh(_:)), for: .valueChanged)
        webView.scrollView.refreshControl = refreshControl

        context.coordinator.webView = webView
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        if context.coordinator.lastReloadToken != reloadToken {
            context.coordinator.lastReloadToken = reloadToken
            uiView.load(URLRequest(url: url))
        }
    }

    class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        var parent: WebViewRepresentable
        weak var webView: WKWebView?
        var lastReloadToken: UUID?

        init(_ parent: WebViewRepresentable) {
            self.parent = parent
            self.lastReloadToken = parent.reloadToken
        }

        @objc func handleRefresh(_ sender: UIRefreshControl) {
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.impactOccurred()
            webView?.reload()
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            parent.isLoading = true
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.isLoading = false
            parent.hasError = false
            webView.scrollView.refreshControl?.endRefreshing()
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
            webView.scrollView.refreshControl?.endRefreshing()
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
            webView.scrollView.refreshControl?.endRefreshing()
            let nsError = error as NSError
            if nsError.code != NSURLErrorCancelled {
                parent.hasError = true
            }
        }

        // Open target="_blank" or external links in Safari
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if navigationAction.targetFrame == nil, let targetURL = navigationAction.request.url {
                if UIApplication.shared.canOpenURL(targetURL) {
                    UIApplication.shared.open(targetURL)
                }
            }
            return nil
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let navigationURL = navigationAction.request.url else {
                decisionHandler(.allow)
                return
            }

            let host = navigationURL.host ?? ""
            if host.contains("thanhtungvo.id.vn") || navigationURL.scheme == "about" || navigationURL.scheme == "blob" {
                decisionHandler(.allow)
            } else if navigationURL.scheme == "http" || navigationURL.scheme == "https" {
                UIApplication.shared.open(navigationURL)
                decisionHandler(.cancel)
            } else {
                decisionHandler(.allow)
            }
        }
    }
}
