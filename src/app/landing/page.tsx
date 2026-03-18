import { DM_Sans } from "next/font/google";
import { LandingPage } from "@/components/landing/LandingPage";
import "./landing.css";

const dmSans = DM_Sans({
    variable: "--font-dm-sans",
    subsets: ["latin"],
    weight: ["400", "500"],
});

export default function LandingRoute() {
    return (
        <div className={dmSans.variable}>
            <LandingPage />
        </div>
    );
}
