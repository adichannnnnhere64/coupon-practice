type Props = {
  children: React.ReactNode;
};

const StoreWrapper = (props: Props) => {
  return (
    <div className="grid md:grid-cols-4  grid-cols-2 gap-4">
      {props.children}
    </div>
  );
};

export default StoreWrapper;
