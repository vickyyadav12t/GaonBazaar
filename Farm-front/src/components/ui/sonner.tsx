import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border-[#d7c7a8] group-[.toaster]:bg-[#fffaf0] group-[.toaster]:text-[#314837] group-[.toaster]:shadow-[0_16px_30px_rgba(59,47,28,0.14)]",
          description: "group-[.toast]:text-[#6c5a3d]",
          actionButton: "group-[.toast]:border group-[.toast]:border-[#c89b3a] group-[.toast]:bg-[#d89b2b] group-[.toast]:text-[#2f2513]",
          cancelButton: "group-[.toast]:border group-[.toast]:border-[#d7c7a8] group-[.toast]:bg-[#fffaf0] group-[.toast]:text-[#315f3b]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
