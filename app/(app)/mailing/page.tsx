const MailingPage = ({
  searchParams: { email_id },
}: {
  searchParams: { email_id: string };
}) => {
  return <div className="w-full h-full items-start justify-start">{email_id}</div>;
};

export default MailingPage;
