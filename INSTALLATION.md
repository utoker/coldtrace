# ColdTrace Map View Installation Guide

## 📦 Dependencies Updated

The following dependencies have been added/updated for the map functionality:

### Frontend Dependencies Added:

- `leaflet: ^1.9.4` - Interactive maps library
- `react-leaflet: ^5.0.0` - React components for Leaflet
- `@types/leaflet: ^1.9.20` - TypeScript types for Leaflet

### React 19 Upgrade:

- `react: ^19.0.0` - Updated to latest React version
- `react-dom: ^19.0.0` - Updated React DOM
- `@types/react: ^19.0.0` - Updated React types
- `@types/react-dom: ^19.0.0` - Updated React DOM types

## 🚀 Installation Steps

1. **Install dependencies:**

   ```bash
   cd apps/frontend
   pnpm install
   ```

2. **Start the development server:**

   ```bash
   # From project root
   pnpm dev
   ```

3. **Access the map view:**
   - Grid View: http://localhost:3000/
   - Map View: http://localhost:3000/map

## 🗺️ Map Features

### ✅ Implemented Features:

- **Interactive Map**: OpenStreetMap tiles with zoom/pan
- **Device Markers**: All devices with latitude/longitude coordinates
- **Status Colors**: Visual indication of device status and temperature
- **Device Popups**: Click markers to see device details
- **Real-time Updates**: Live data via WebSocket subscriptions
- **Modal Integration**: Click "View Details" to open DeviceDetailModal
- **Navigation**: Toggle between Grid and Map views
- **Responsive Design**: Works on desktop and mobile

### 🎨 Marker Colors:

- 🟢 **Green**: Normal temperature, device online
- 🟠 **Orange**: Warning temperature or maintenance mode
- 🔴 **Red**: Critical temperature alerts
- ⚫ **Gray**: Device offline

### 📍 Device Locations:

The seed data includes 10 devices in the Tampa Bay area:

- Tampa General Hospital
- USF Health Campus
- Moffitt Cancer Center
- CVS Pharmacy locations
- Walgreens stores
- Florida Dept of Health
- Mobile vaccine units

## 🔧 Technical Details

### Map Implementation:

- **Library**: React-Leaflet (free, no API key required)
- **Tiles**: OpenStreetMap (free)
- **SSR**: Dynamic imports to prevent server-side rendering issues
- **Performance**: Lazy loading of map components

### Data Flow:

1. GraphQL query fetches devices with coordinates
2. Real-time updates via WebSocket subscriptions
3. Markers update automatically when device data changes
4. Click handlers open DeviceDetailModal with full device details

### Browser Support:

- Modern browsers with ES6+ support
- Mobile responsive design
- Touch-friendly interactions

## 🐛 Troubleshooting

### Map not loading:

1. Check browser console for errors
2. Ensure all dependencies are installed
3. Verify network connection for map tiles

### Markers not appearing:

1. Check that devices have valid latitude/longitude coordinates
2. Verify GraphQL query includes location fields
3. Check browser console for data loading errors

### Performance issues:

1. Map renders only devices with valid coordinates
2. Uses efficient React-Leaflet components
3. Real-time updates are debounced to prevent excessive re-renders

## 📝 Next Steps

To enhance the map further, consider:

- Device clustering for better performance with many devices
- Custom marker icons based on device type
- Heat map overlay for temperature data
- Route planning for mobile units
- Geofencing alerts for device locations
