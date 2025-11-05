import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { useCultivosStore } from "../stores/cultivos"


function LocationPicker() {
  const { farm, updateFarm } = useCultivosStore()

  useMapEvents({
    click(e) {
      updateFarm({ localizacao: { lat: e.latlng.lat, lng: e.latlng.lng } })
    },
  })

  return farm.localizacao ? (
    <Marker position={[farm.localizacao.lat, farm.localizacao.lng]} />
  ) : null
}

export default function MapaFazenda() {
  const { farm } = useCultivosStore()

  return (
    <div className="mt-4 flex flex-col items-center">
      <MapContainer
        center={farm.localizacao || [-15.78, -47.93]} // Brasilia como default
        zoom={5}
        style={{ width: "300px", height: "300px", borderRadius: "8px" }} // quadrado menor
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <LocationPicker />
      </MapContainer>

      {farm.localizacao && (
        <p className="text-xs text-gray-600 mt-2">
          Localização escolhida: {farm.localizacao.lat.toFixed(4)},{" "}
          {farm.localizacao.lng.toFixed(4)}
        </p>
      )}
    </div>
  )
}
