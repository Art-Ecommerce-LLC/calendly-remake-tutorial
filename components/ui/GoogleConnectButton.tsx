'use client';

import {useState } from 'react';
import { Button } from '@nextui-org/button';
import {Spinner} from "@nextui-org/spinner";
import { useRouter } from 'next/navigation';

export default function GoogleConnectButton() {

    const [isLoading, setLoading] = useState(false);
    const router = useRouter();

    async function handleGoogleSignIn() {
        setLoading(true);
        router.push('/api/auth/google');
    }

    return (
            <Button
                onClick={handleGoogleSignIn}
                isDisabled={isLoading}
                className="bg-chart-1 w-full">
                    {isLoading ? (
                        <>
                            <Spinner size="sm" />
                            <span>Redirecting..</span>
                        </>
                    ) : (
                        "Sign in with Google"
                    )}
            </Button>
    )

}