"use client";

import { Modal } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

interface Props {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    title: string;
    children: ReactNode;
    size?: ComponentProps<typeof Modal.Container>["size"];
}

export const CustomModal = (props: Props) => {
    const { isOpen, onOpenChange, title, size = "md", children } = props;

    return (
        <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
            <Modal.Container scroll="inside" size={size}>
                <Modal.Dialog className="w-full">
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
