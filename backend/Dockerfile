# syntax=docker/dockerfile:1
#
# Três alvos a partir do mesmo build:
#   runtime     a API (padrão)
#   migrations  bundle do EF Core que cria/atualiza o banco e termina
# Contexto de build: a pasta backend/.

ARG DOTNET_VERSION=10.0

FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS build
WORKDIR /src

# Restore em camada própria: só refaz quando um .csproj ou a lista de pacotes muda.
COPY global.json Directory.Build.props Directory.Packages.props ./
COPY src/Core/Booking.Domain/Booking.Domain.csproj src/Core/Booking.Domain/
COPY src/Core/Booking.Arguments/Booking.Arguments.csproj src/Core/Booking.Arguments/
COPY src/Core/Booking.Application/Booking.Application.csproj src/Core/Booking.Application/
COPY src/Infrastructure/Booking.Infrastructure/Booking.Infrastructure.csproj src/Infrastructure/Booking.Infrastructure/
COPY src/Presentation/Booking.Api/Booking.Api.csproj src/Presentation/Booking.Api/
RUN dotnet restore src/Presentation/Booking.Api/Booking.Api.csproj

COPY src/ src/
RUN dotnet publish src/Presentation/Booking.Api/Booking.Api.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false

# ---------- Migrations ----------
FROM build AS migrations-build
ARG DOTNET_EF_VERSION=10.0.4
RUN dotnet tool install --global dotnet-ef --version ${DOTNET_EF_VERSION}
ENV PATH="${PATH}:/root/.dotnet/tools"
RUN dotnet ef migrations bundle \
      --project src/Infrastructure/Booking.Infrastructure \
      --startup-project src/Infrastructure/Booking.Infrastructure \
      --configuration Release \
      --output /app/efbundle

FROM mcr.microsoft.com/dotnet/runtime:${DOTNET_VERSION} AS migrations
WORKDIR /app
COPY --from=migrations-build /app/efbundle ./efbundle
USER $APP_UID
# A connection string chega por variável de ambiente; nada fica gravado na imagem.
ENTRYPOINT ["/bin/sh", "-c", "exec ./efbundle --connection \"$ConnectionStrings__Default\""]

# ---------- API ----------
FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS runtime
WORKDIR /app
COPY --from=build /app/publish ./
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "Booking.Api.dll"]
