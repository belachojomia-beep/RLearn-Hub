package com.rlearnhub.gateway.security;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthenticationFilter
        implements GlobalFilter, Ordered {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Mono<Void> filter(
            ServerWebExchange exchange,
            GatewayFilterChain chain
    ) {

        String path =
                exchange.getRequest()
                        .getURI()
                        .getPath();

        String method =
                exchange.getRequest()
                        .getMethod()
                        .name();

        /*
         * Login and registration are public.
         */
        if (path.equals("/api/auth/login")
                || path.equals("/api/auth/register")) {

            return chain.filter(exchange);
        }

        /*
         * Get Authorization header.
         */
        String authorizationHeader =
                exchange.getRequest()
                        .getHeaders()
                        .getFirst(HttpHeaders.AUTHORIZATION);

        /*
         * No JWT token.
         */
        if (authorizationHeader == null
                || !authorizationHeader.startsWith("Bearer ")) {

            return unauthorized(exchange);
        }

        /*
         * Remove "Bearer " from the header.
         */
        String token =
                authorizationHeader.substring(7);

        /*
         * Validate JWT.
         */
        if (!jwtService.isTokenValid(token)) {

            return unauthorized(exchange);
        }

        /*
         * Get the user's role from the JWT.
         */
        String role =
                jwtService.extractRole(token);

        /*
         * Check role-based permissions.
         */
        if (!isAllowed(path, method, role)) {

            return forbidden(exchange);
        }

        /*
         * JWT is valid and the role is allowed.
         */
        return chain.filter(exchange);
    }

    private boolean isAllowed(
            String path,
            String method,
            String role
    ) {
        /*
     * Admin endpoints:
     * ADMIN only.
     */
    if (path.startsWith("/api/admin/")) {

        return role.equals("ADMIN");
    }
    /*
     * Resource upload:
     * TEACHER and ADMIN only.
     */
    if (path.equals("/api/resources/upload")
            && method.equals("POST")) {

        return role.equals("TEACHER")
                || role.equals("ADMIN");
    }
        /*
         * Resource upload:
         * TEACHER and ADMIN only.
         */

        /*
         * Resource delete:
         * TEACHER and ADMIN only.
         */
        if (path.matches("/api/resources/[0-9]+")
                && method.equals("DELETE")) {

            return role.equals("TEACHER")
                    || role.equals("ADMIN");
        }

        /*
         * Subject creation:
         * TEACHER and ADMIN only.
         */
        if (path.equals("/api/subjects")
                && method.equals("POST")) {

            return role.equals("TEACHER")
                    || role.equals("ADMIN");
        }

        /*
         * Subject update/delete:
         * TEACHER and ADMIN only.
         */
        if (path.matches("/api/subjects/[0-9]+")
                && (method.equals("PUT")
                || method.equals("DELETE"))) {

            return role.equals("TEACHER")
                    || role.equals("ADMIN");
        }

        /*
         * All other authenticated requests
         * are currently allowed.
         *
         * This includes:
         * GET resources
         * GET subjects
         * resource downloads
         * download tracking
         * notifications
         * announcements
         * dashboard
         */
        return true;
    }

    private Mono<Void> unauthorized(
            ServerWebExchange exchange
    ) {

        exchange.getResponse()
                .setStatusCode(HttpStatus.UNAUTHORIZED);

        return exchange.getResponse()
                .setComplete();
    }

    private Mono<Void> forbidden(
            ServerWebExchange exchange
    ) {

        exchange.getResponse()
                .setStatusCode(HttpStatus.FORBIDDEN);

        return exchange.getResponse()
                .setComplete();
    }

    @Override
    public int getOrder() {
        return -1;
    }
}