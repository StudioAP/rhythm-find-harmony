
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 認証ページにリダイレクト
    navigate("/auth");
  }, [navigate]);

  return null;
};

export default Login;
