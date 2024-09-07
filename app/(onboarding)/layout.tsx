import { FooterOnboarding } from "./_components/footer-onboarding";

const OnboardingLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="w-full h-dvh max-h-dvh min-h-dvh overflow-x-hidden overflow-y-scroll relative items-center justify-center flex flex-col">
      {children}
      <FooterOnboarding />
    </main>
  );
};

export default OnboardingLayout;
