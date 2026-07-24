import { NextIntlClientProvider } from "next-intl";
import type { PropsWithChildren, ReactNode } from "react";
import messages from "@/i18n/messages/en.json";
import { render } from "@testing-library/react";

export const renderWithIntl = (ui: ReactNode) => {
    const wrapper = ({ children }: PropsWithChildren) => (
        <NextIntlClientProvider locale="en" messages={messages}>
            {children}
        </NextIntlClientProvider>
    );

    return render(ui, { wrapper });
};
