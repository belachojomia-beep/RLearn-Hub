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

        String path = exchange.getRequest()
                .getURI()
                .getPath();

        String method = exchange.getRequest()
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
         * Get the Authorization header.
         */
        String authorizationHeader = exchange.getRequest()
                .getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);

        /*
         * Reject requests without a Bearer token.
         */
        if (authorizationHeader == null
                || !authorizationHeader.startsWith("Bearer ")) {
            return unauthorized(exchange);
        }

        /*
         * Extract and validate the JWT.
         */
        String token = authorizationHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
            return unauthorized(exchange);
        }

        /*
         * Get the user's role from the JWT.
         */
        String role = jwtService.extractRole(token);

        /*
         * Enforce role-based permissions.
         */
        if (!isAllowed(path, method, role)) {
            return forbidden(exchange);
        }

        /*
         * Token is valid and the role is allowed.
         */
        return chain.filter(exchange);
    }

    private boolean isAllowed(
            String path,
            String method,
            String role
    ) {

        /*
         * ADMIN RESOURCE REVIEW:
         * Only administrators may list pending resources
         * and preview or download files for review.
         */
        if (path.equals("/api/resources/review")
                || path.matches(
                        "/api/resources/review/[0-9]+/(file|download)"
                )) {
            return role.equals("ADMIN");
        }

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
         * Resource deletion:
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
         * Subject update and deletion:
         * TEACHER and ADMIN only.
         */
        if (path.matches("/api/subjects/[0-9]+")
                && (method.equals("PUT")
                || method.equals("DELETE"))) {
            return role.equals("TEACHER")
                    || role.equals("ADMIN");
        }

        /*
         * Other authenticated requests are allowed by this
         * filter, subject to the downstream service's own
         * authorization and validation.
         *
         * Examples:
         * GET approved resources
         * GET subjects
         * regular resource downloads
         * announcements
         * notifications
         * dashboard requests
         */
        return true;
    }

    private Mono<Void> unauthorized(
            ServerWebExchange exchange
    ) {

        exchange.getResponse()
                .setStatusCode(HttpStatus.UNAUTHORIZED);

        return exchange.getResponse().setComplete();
    }

    private Mono<Void> forbidden(
            ServerWebExchange exchange
    ) {

        exchange.getResponse()
                .setStatusCode(HttpStatus.FORBIDDEN);

        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        return -1;
    }
}