
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const galleryImages = [
  {
    id: 1,
    src: "/api/placeholder/300/200",
    alt: "Hangar exterior view",
    title: "Hangar Exterior",
    description: "Main hangar facility overview"
  },
  {
    id: 2,
    src: "/api/placeholder/300/200",
    alt: "Temperature sensor installation",
    title: "Temperature Sensors",
    description: "Wireless temperature monitoring setup"
  },
  {
    id: 3,
    src: "/api/placeholder/300/200",
    alt: "Air quality monitoring station",
    title: "Air Quality Station",
    description: "PM2.5 and PM10 monitoring equipment"
  },
  {
    id: 4,
    src: "/api/placeholder/300/200",
    alt: "Humidity sensor network",
    title: "Humidity Sensors",
    description: "Distributed humidity monitoring points"
  },
  {
    id: 5,
    src: "/api/placeholder/300/200",
    alt: "Control panel interface",
    title: "Control Center",
    description: "Central monitoring and control station"
  },
  {
    id: 6,
    src: "/api/placeholder/300/200",
    alt: "Maintenance checkpoint",
    title: "Maintenance Bay",
    description: "Equipment maintenance and calibration area"
  }
];

export function ImageGallery() {
  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle>Facility Gallery</CardTitle>
        <CardDescription>
          Visual documentation of sensor installations and facility overview
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryImages.map((image) => (
            <div
              key={image.id}
              className="group relative overflow-hidden rounded-lg bg-muted cursor-pointer"
            >
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                className="w-full h-48 object-cover image-zoom transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <div className="p-4 text-white">
                  <h4 className="font-semibold text-sm">{image.title}</h4>
                  <p className="text-xs text-gray-200">{image.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
