import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req) {
  try {
    const { firstname, lastname, email, password } = await req.json();

    const response = await axios.post(`http://localhost:5000/signup`, {
        firstname,
        lastname,
        email,
        password,
      });
        if (response.status === 201) {
    return NextResponse.json({
        user: {
          firstname,
          lastname,
          email,
          password,
        },
      });
    } else {
        return new NextResponse(
          JSON.stringify({
            status: "error",
            message: "User registration failed.",
          }),
          { status: 500 }
        );
    }
    } catch (error) {
      return new NextResponse(
        JSON.stringify({
          status: "error",
          message: error.message,
        }),
        { status: 500 }
      );
    }
}  