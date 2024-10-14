'use client';
import { Button } from '@nextui-org/button';


export default function GenerateKey() {


    async function getKey() {
        console.log("Generating key...");
        const res = await fetch('/api/keyGenerate');
        const key = await res.json();
        console.log(key);
    }

    return (
        <div>
            <Button
                className="bg-chart-1 w-full"
                onClick={getKey}>
                    Generate Key
            </Button>

        </div>
    )
}