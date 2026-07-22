"use client";

import { Modal } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

interface Props {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    title: string;
    children: ReactNode;
    allowFullScreenOnMobile?: boolean;
    size?: ComponentProps<typeof Modal.Container>["size"];
}

export const CustomModal = (props: Props) => {
    const {
        isOpen,
        onOpenChange,
        title,
        size = "md",
        children,
        allowFullScreenOnMobile = false,
    } = props;

    return (
        <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
            <Modal.Container
                className={allowFullScreenOnMobile ? "p-0 md:p-10" : undefined}
                scroll={allowFullScreenOnMobile ? "outside" : "inside"}
                size={size}
            >
                <Modal.Dialog
                    className={
                        allowFullScreenOnMobile
                            ? "md:shadow-overlay min-h-full max-w-none rounded-none shadow-none md:min-h-0 md:max-w-lg md:rounded-3xl"
                            : "w-full"
                    }
                >
                    <Modal.CloseTrigger />
                    <Modal.Header className="border-b">
                        <Modal.Heading className="text-xl font-semibold">{title}</Modal.Heading>
                    </Modal.Header>
                    <Modal.Body className="space-y-4 py-6">{children}</Modal.Body>
                </Modal.Dialog>
            </Modal.Container>
        </Modal.Backdrop>
    );
};
