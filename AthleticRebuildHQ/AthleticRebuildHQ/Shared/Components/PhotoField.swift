import SwiftUI
import PhotosUI
import UIKit

/// A reusable photo attachment control. Shows the current image (or a
/// placeholder) and lets the user pick from the photo library or take a new
/// photo with the camera. Binds to optional `Data` so it plugs directly into
/// SwiftData model properties.
struct PhotoField: View {
    let title: String
    @Binding var data: Data?
    /// Aspect ratio for the preview frame.
    var height: CGFloat = 200

    @State private var pickerItem: PhotosPickerItem?
    @State private var showCamera = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Theme.secondaryText)

            ZStack {
                if let data, let image = UIImage(data: data) {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                } else {
                    RoundedRectangle(cornerRadius: Theme.cornerRadius, style: .continuous)
                        .fill(Theme.cardElevated)
                        .overlay {
                            VStack(spacing: 8) {
                                Image(systemName: "photo.on.rectangle.angled")
                                    .font(.largeTitle)
                                Text("No photo yet")
                                    .font(.footnote)
                            }
                            .foregroundStyle(Theme.secondaryText)
                        }
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: height)
            .clipShape(RoundedRectangle(cornerRadius: Theme.cornerRadius, style: .continuous))

            HStack(spacing: 12) {
                PhotosPicker(selection: $pickerItem, matching: .images) {
                    Label("Library", systemImage: "photo")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)

                Button {
                    showCamera = true
                } label: {
                    Label("Camera", systemImage: "camera.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)

                if data != nil {
                    Button(role: .destructive) {
                        data = nil
                    } label: {
                        Image(systemName: "trash")
                    }
                    .buttonStyle(.bordered)
                }
            }
            .tint(Theme.accentBright)
        }
        .onChange(of: pickerItem) { _, newValue in
            guard let newValue else { return }
            Task {
                if let loaded = try? await newValue.loadTransferable(type: Data.self) {
                    // Downscale to keep the store lean.
                    data = ImageHelper.compress(loaded)
                }
            }
        }
        .sheet(isPresented: $showCamera) {
            CameraPicker { captured in
                if let captured { data = ImageHelper.compress(captured) }
            }
            .ignoresSafeArea()
        }
    }
}

/// Image utilities for keeping attached photos a reasonable size.
enum ImageHelper {
    /// Re-encodes image data as JPEG, downscaling large images.
    static func compress(_ data: Data, maxDimension: CGFloat = 1280, quality: CGFloat = 0.7) -> Data {
        guard let image = UIImage(data: data) else { return data }
        let resized = resize(image, maxDimension: maxDimension)
        return resized.jpegData(compressionQuality: quality) ?? data
    }

    private static func resize(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let size = image.size
        let largest = max(size.width, size.height)
        guard largest > maxDimension else { return image }
        let scale = maxDimension / largest
        let newSize = CGSize(width: size.width * scale, height: size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: newSize))
        }
    }
}

/// Thin wrapper around `UIImagePickerController` for camera capture.
struct CameraPicker: UIViewControllerRepresentable {
    /// Returns JPEG-able image data, or nil if cancelled.
    let onCapture: (Data?) -> Void
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        // Fall back to the photo library if no camera is available (e.g. Simulator).
        picker.sourceType = UIImagePickerController.isSourceTypeAvailable(.camera) ? .camera : .photoLibrary
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    final class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        let parent: CameraPicker
        init(_ parent: CameraPicker) { self.parent = parent }

        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            let image = info[.originalImage] as? UIImage
            parent.onCapture(image?.jpegData(compressionQuality: 0.9))
            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.onCapture(nil)
            parent.dismiss()
        }
    }
}
