package com.echo.echobackend.repository;

import com.echo.echobackend.model.Like;
import com.echo.echobackend.model.LikeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LikeRepository extends JpaRepository<Like, LikeId> {
    // Métodos para buscar likes por usuario o canción, etc.
}