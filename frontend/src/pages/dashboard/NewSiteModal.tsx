import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  title: z.string().min(1, "Title can't be empty").max(50),
  subdomain: z.string().min(1, "Subdomain can't be empty").max(50).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, hyphens only"),
});

type FormData = z.infer<typeof schema>;

const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || "localhost:5173";

export default function NewSiteModal({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", subdomain: "" },
  });

  const onSubmit = async (data: FormData) => {
    const res = await api<{ site: unknown }>("/sites", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (res.success) {
      toast.success("Success", { description: `${data.title} has been created.` });
      setOpen(false);
      form.reset();
      onCreated?.();
    } else {
      toast.error("Error", { description: res.msg || "Failed to create site" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New Site</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Site</DialogTitle>
          <DialogDescription>Enter the details for your new site.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subdomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subdomain</FormLabel>
                  <FormControl>
                    <div className="flex rounded-md border border-input focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2">
                      <Input
                        {...field}
                        className="rounded-r-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <div className="inline-flex items-center px-3 text-sm border-l border-input bg-muted text-muted-foreground rounded-r-md">
                        .{ROOT_DOMAIN}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator className="my-4" />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Site"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
