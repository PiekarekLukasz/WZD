import logo from './logo.svg';
import './App.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { queryAllByAltText, queryByTestId } from '@testing-library/react';
import 'leaflet/dist/leaflet.css';
import  { useEffect, useState }  from 'react';

// naprawa znacznikow leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';


let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow
});

L.Marker.prototype.options.icon = DefaultIcon;
// koniec sekcji

let missing_places = [];

// generator znacznikow

function Gen_marker(data_point) {
  let name = data_point["place"];
  let pos = [data_point["lat"], data_point["lon"]];

  if(data_point["lat"] === 0 && data_point["lon"] === 0){
    missing_places.push(name);
    return;
  }
  let source = "/get_img/"+data_point["filename"];

  return (
    <Marker key={name} position={pos}>
      <Popup>
        <img src={source}  width={100}/>
        <br/>
        {name}
      </Popup>
    </Marker>
  );
}

function Add_markers(data){
  let marker_divs = [];
  for(let i = 0; i < data.length; i++)
  {
    marker_divs.push(Gen_marker(data[i]))
  }
  return marker_divs;
}
//koniec sekcji

const App = () => {

  const [getJson, setJson] = useState([]);
  const [getMarkers, setMarkers] = useState([]);
  const [getReady, setReady] = useState(false);

  useEffect(()=>{
      fetch('/list')
      .then(res => res.json())
      .then(data => setJson(data))
      .then(()=>setMarkers(Add_markers(getJson)))
      .then(()=>setReady(true));
    }, [getReady])

  return (
    <div className="App">
      <header className="App-header">
      <b>Wizualizacja wielkich zbiorów danych.</b>
      <br/>
      <br/>
      Pierwszy kamień milowy
      </header>
      <div id="map">
      <MapContainer center={[0,0]} zoom={3} scrollWheelZoom={true} 
        style={{ height:"900px", marginLeft:"150px", marginRight:"150px"}} >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {getMarkers}
        </MapContainer>
      </div>
      <div id="miss">
        <br/>
        <b>Brakujące miejsca :</b>
        <br/>
        {missing_places.map(function(d, idx){return (<li key={idx}>{d}</li>)})}
      </div>
    </div>
  );
}

export default App;
