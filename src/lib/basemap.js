//referensi: https://leaflet-extras.github.io/leaflet-providers/preview/

export const baseMaps = [
    {
        id: 'esri-worldimagery',
        name: 'Esri World Imagery',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
	    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        imageUrl: '/images/basemaps/esri_worldimagery.png'
    },
    {
        id: 'osm',
        name: 'Open Street Map',
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        imageUrl: '/images/basemaps/openstreetmap_de.png'
    },
    { // topografi Esri
        id: 'esri-topo',
        name: 'Esri Topographic',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
        imageUrl: '/images/basemaps/esri-topo.png'
    },
    {
        id: 'open-topo',
        name: 'Open Topo Map',
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', 
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        maxZoom: 17,
        imageUrl: '/images/basemaps/topo-map.png'
    },

];