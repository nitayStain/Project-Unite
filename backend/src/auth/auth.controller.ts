import { Controller, Get, Post, Body, HttpStatus, Req, Res, UseInterceptors, ClassSerializerInterceptor, UseFilters, HttpCode } from '@nestjs/common';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';
import { HttpSuccess } from 'src/utils/http.success';
import { Request, Response } from 'express';
import { CookieJar } from 'src/decorators/cookies.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) {}

    // TODO: ReCaptcha when frontend is completed
    @HttpCode(200)
    @Post("/register")
    async register(@Body() regData: RegisterDto) {

        return HttpSuccess.createSuccess(HttpSuccess.Messages.USER_CREATED,  { user: await this.authService.register(regData)});
    }

    @HttpCode(200)
    @Post("/login")
    async login(@Body() loginData: LoginDto, @Req() req: Request, @Res({passthrough: true}) res: Response) {
        const retData = await this.authService.login(loginData);
        
        res.cookie('ref_token', retData.refToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        }).cookie('user_id', retData.userId, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        }).json(HttpSuccess.createSuccess(HttpSuccess.Messages.LOGGED_IN))
    }


    // TODO: create a service both in auth and users that removes the refresh token from the db
    @HttpCode(200)
    @Post("/logout")
    async logout(@CookieJar() cookieJar: {ref_token: string, user_id: string}, @Req() req: Request, @Res({passthrough: true}) res: Response) {
        await this.authService.logout(cookieJar.ref_token, cookieJar.user_id);
        
        res.clearCookie('ref_token');
        res.clearCookie('user_id');
        res.json(HttpSuccess.createSuccess(HttpSuccess.Messages.LOGGED_OUT));
    }

    @HttpCode(200)
    @Post("/refresh-token")
    async refreshToken(@CookieJar() cookieJar: {ref_token: string, user_id: string}) {
        const authToken = await this.authService.refreshToken(cookieJar.ref_token, cookieJar.user_id);
        
        return HttpSuccess.createSuccess(HttpSuccess.Messages.REFRESHED_TOK, {authToken});
    }
}
