// Lifts every subject out of an image with Apple's Vision (the same as "Remove background" in Photos).
// usage: lift <in.png> <outdir> <prefix>   -> writes <prefix>-1.png, <prefix>-2.png ... (left to right), cropped with alpha
import Foundation
import Vision
import CoreImage
import AppKit

let args = CommandLine.arguments
guard args.count >= 4 else { print("usage: lift in outdir prefix"); exit(1) }
let url = URL(fileURLWithPath: args[1])
let outDir = URL(fileURLWithPath: args[2])
let prefix = args[3]
let together = args.count > 4 && args[4] == "all"
guard let ci = CIImage(contentsOf: url) else { print("cannot read"); exit(1) }
let handler = VNImageRequestHandler(ciImage: ci)
let req = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([req])
guard let result = req.results?.first else { print("no subjects"); exit(2) }
let ctx = CIContext()
var pieces: [(CGRect, CGImage)] = []
if together {
  let buf = try result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: true)
  let img = CIImage(cvPixelBuffer: buf)
  let cg = ctx.createCGImage(img, from: img.extent)!
  let data = NSBitmapImageRep(cgImage: cg).representation(using: .png, properties: [:])!
  try data.write(to: outDir.appendingPathComponent("\(prefix).png"))
  print(prefix, cg.width, cg.height); exit(0)
}
for inst in result.allInstances {
  let buf = try result.generateMaskedImage(ofInstances: IndexSet(integer: inst), from: handler, croppedToInstancesExtent: true)
  let img = CIImage(cvPixelBuffer: buf)
  // where it sits in the source, to order left to right
  let maskBuf = try result.generateScaledMaskForImage(forInstances: IndexSet(integer: inst), from: handler)
  let mask = CIImage(cvPixelBuffer: maskBuf)
  var minX = CGFloat.greatestFiniteMagnitude
  // cheap bbox: use the cropped size + scan via CGImage of mask
  if let cgm = ctx.createCGImage(mask, from: mask.extent) {
    let w = cgm.width, h = cgm.height
    let data = CFDataGetBytePtr(cgm.dataProvider!.data)!
    let bpr = cgm.bytesPerRow, bpp = cgm.bitsPerPixel / 8
    for y in stride(from: 0, to: h, by: 4) { for x in stride(from: 0, to: w, by: 4) { if data[y * bpr + x * bpp] > 127 { minX = min(minX, CGFloat(x)) } } }
  }
  if let cg = ctx.createCGImage(img, from: img.extent) { pieces.append((CGRect(x: minX, y: 0, width: img.extent.width, height: img.extent.height), cg)) }
}
pieces.sort { $0.0.minX < $1.0.minX }
for (i, p) in pieces.enumerated() {
  let rep = NSBitmapImageRep(cgImage: p.1)
  let data = rep.representation(using: .png, properties: [:])!
  let out = outDir.appendingPathComponent("\(prefix)-\(i + 1).png")
  try data.write(to: out)
  print(out.lastPathComponent, p.1.width, p.1.height)
}
