'use client';

import {useState } from 'react';
import { Button } from '@nextui-org/button';
import {Spinner} from "@nextui-org/spinner";

export default function GoogleConnectButton() {

    const [isLoading, setLoading] = useState(false);

    async function handleGoogleSignIn() {
        setLoading(true);
        window.open('/api/auth/google', '_blank');
    }

    return (
        <div>
            <Button
                onClick={handleGoogleSignIn}
                isDisabled={isLoading}
                className="bg-chart-1 w-full">
                    {isLoading ? (
                        <>
                            <Spinner size="sm" />
                            <span>Signing in on new page...</span>
                        </>
                    ) : (
                        "Sign in with Google"
                    )}
            </Button>

        </div>
    )

}