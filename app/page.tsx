
import { AppointmentsComponent } from "@/components/forms/AppointmentsComponent";
import {NextUIProvider} from "@nextui-org/react";
import GenerateKey from "@/components/ui/GenerateKey";

export default function App() {
  return (
    
    <div className="flex flex-col justify-center items-center align-center w-screen h-screen p-6">
      <div className="max-h-full">
        <h1 className="text-4xl p-6">Create Appointment Schedule</h1>
        <NextUIProvider>
          <AppointmentsComponent />
          <GenerateKey />
        </NextUIProvider>
      </div>
    </div>
  );
}
