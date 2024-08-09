type ButtonProps = {
    click?: () => void;
    b_name: string;
    color: string;
    width: string | number;
    height: string | number;
    t_color?: string;
    border?: string;
  };
  
  export default function S_Button({
    click,
    b_name,
    color,
    width,
    height,
    t_color = "#1A2828",
    border = "none",
  }: ButtonProps) {
    const style = {
      backgroundColor: color,
      width: width,
      height: height,
      color: t_color,
      border: border,
    };
  
    return (
      <div onClick={click} className="button-raffle" style={style}>
        {b_name}
      </div>
    );
  }