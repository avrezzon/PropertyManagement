import RentalCalculator from './RentalCalculator'
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID_HERE"}>
            <RentalCalculator />
        </GoogleOAuthProvider>
    );
}

export default App
